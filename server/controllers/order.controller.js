const supabase = require("../config/supabase");
const { validationResult } = require("express-validator");

const orderController = {
  createOrder: async (req, res) => {
    try {
      console.log('📦 Starting order creation...');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation failed", errors: errors.array() });
      }

      const { items, deliveryAddress } = req.body;
      const consumerId = req.user?.id || req.user?._id;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items array is required and must not be empty" });
      }
      if (!deliveryAddress || deliveryAddress.trim().length < 10) {
        return res.status(400).json({ message: "Delivery address must be at least 10 characters long" });
      }
      if (!consumerId) {
        return res.status(401).json({ message: "User authentication required" });
      }

      const productIds = items.map(item => item.product);
      
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('*, farmer:users!products_farmer_id_fkey(id, name, email)')
        .in('id', productIds);
        
      if (productError) throw productError;

      if (!products || products.length !== productIds.length) {
        return res.status(404).json({ message: "Some products not found" });
      }

      let subtotal = 0;
      const orderItems = [];
      let farmerId = null;

      const productMap = products.reduce((map, p) => { map[p.id] = p; return map; }, {});

      for (const product of products) {
        if (!farmerId) {
          farmerId = product.farmer_id;
        } else if (farmerId !== product.farmer_id) {
          return res.status(400).json({ message: "All items must be from the same farmer" });
        }
      }

      for (const item of items) {
        const product = productMap[item.product];
        
        if (product.quantity_available < item.qty) {
          return res.status(400).json({ message: `Insufficient quantity for ${product.title}. Available: ${product.quantity_available}` });
        }
        if (product.min_order_qty > item.qty) {
          return res.status(400).json({ message: `Minimum order quantity for ${product.title} is ${product.min_order_qty}` });
        }

        const itemTotal = product.price_per_unit * item.qty;
        subtotal += itemTotal;

        orderItems.push({
          product: product.id,
          title: product.title,
          qty: item.qty,
          unitPrice: product.price_per_unit,
          measuringUnit: product.measuring_unit
        });
      }

      // Decrement stock
      for (const item of items) {
        const product = productMap[item.product];
        await supabase
          .from('products')
          .update({ quantity_available: product.quantity_available - item.qty })
          .eq('id', product.id);
      }

      // Insert Order
      const { data: savedOrder, error: insertError } = await supabase
        .from('orders')
        .insert([{
          consumer_id: consumerId,
          farmer_id: farmerId,
          items: orderItems,
          subtotal,
          delivery_address: deliveryAddress.trim(),
          status: "placed"
        }])
        .select()
        .single();
        
      if (insertError) throw insertError;

      savedOrder._id = savedOrder.id;

      res.status(201).json({
        message: "Order created successfully",
        order: savedOrder
      });

    } catch (error) {
      console.error('❌ Order creation error:', error);
      res.status(500).json({ message: 'Server error creating order', error: error.message });
    }
  },

  getConsumerOrders: async (req, res) => {
    try {
      const consumerId = req.user?.id || req.user?._id;
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, farmer:users!orders_farmer_id_fkey(id, name, email, phone, address)')
        .eq('consumer_id', consumerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders = orders.map(order => {
        const dt = new Date(order.created_at);
        const orderNumber = `ORD-${dt.getFullYear()}-${order.id.slice(-4).toUpperCase()}`;
        const trackingNumber = `TRK${order.id.slice(-6).toUpperCase()}`;
        const trackingHistory = generateTrackingHistory(order);
        
        return {
          _id: order.id,
          orderNumber,
          status: order.status,
          totalAmount: order.subtotal,
          createdAt: order.created_at,
          items: order.items.map(item => ({
            product: {
              title: item.title,
              pricePerUnit: item.unitPrice,
              measuringUnit: item.measuringUnit
            },
            quantity: item.qty,
            price: item.unitPrice * item.qty
          })),
          trackingNumber,
          trackingHistory,
          farmer: order.farmer
        };
      });

      res.json({ success: true, orders: transformedOrders });
    } catch (error) {
      console.error('Error fetching consumer orders:', error);
      res.status(500).json({ success: false, message: "Server error fetching orders", error: error.message });
    }
  },

  getFarmerOrders: async (req, res) => {
    try {
      const farmerId = req.user?.id || req.user?._id;
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, consumer:users!orders_consumer_id_fkey(id, name, email, phone, address)')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedOrders = orders.map(o => ({...o, _id: o.id}));
      res.json({ success: true, orders: mappedOrders });
    } catch (error) {
      console.error('Error fetching farmer orders:', error);
      res.status(500).json({ success: false, message: "Server error fetching orders", error: error.message });
    }
  },

  getOrder: async (req, res) => {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select('*, consumer:users!orders_consumer_id_fkey(*), farmer:users!orders_farmer_id_fkey(*)')
        .eq('id', req.params.id)
        .single();

      if (error || !order) return res.status(404).json({ success: false, message: "Order not found" });

      const userId = req.user?.id || req.user?._id;
      if (order.consumer_id !== userId && order.farmer_id !== userId) {
         return res.status(403).json({ success: false, message: "Not authorized to view this order" });
      }

      order._id = order.id;
      res.json({ success: true, order });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ success: false, message: "Server error fetching order" });
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ["placed", "accepted", "packed", "dispatched", "delivered", "cancelled"];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status", validStatuses });
      }

      const { data: order, error: findError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
        
      if (findError || !order) return res.status(404).json({ success: false, message: "Order not found" });

      const userId = req.user?.id || req.user?._id;
      if (order.farmer_id !== userId) {
        return res.status(403).json({ success: false, message: "Not authorized to update this order" });
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select('*, consumer:users!orders_consumer_id_fkey(*), farmer:users!orders_farmer_id_fkey(*)')
        .single();
        
      if (updateError) throw updateError;
      updatedOrder._id = updatedOrder.id;

      res.json({ success: true, message: "Order status updated successfully", order: updatedOrder });
    } catch (error) {
      console.error('Error updating order:', error);
      res.status(500).json({ success: false, message: "Server error updating order" });
    }
  }
};

function generateTrackingHistory(order) {
  const trackingHistory = [];
  const createdAt = new Date(order.created_at);
  
  trackingHistory.push({
    timestamp: createdAt.toISOString(),
    description: 'Order placed',
    location: 'Online Store',
    status: 'completed'
  });

  if (['accepted', 'packed', 'dispatched', 'delivered'].includes(order.status)) {
    const acceptedDate = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
    trackingHistory.push({
      timestamp: acceptedDate.toISOString(),
      description: 'Order confirmed',
      location: 'Farm Warehouse',
      status: 'completed'
    });
  }

  if (['packed', 'dispatched', 'delivered'].includes(order.status)) {
    const packedDate = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
    trackingHistory.push({
      timestamp: packedDate.toISOString(),
      description: 'Order packed',
      location: 'Farm Warehouse',
      status: 'completed'
    });
  }

  if (['dispatched', 'delivered'].includes(order.status)) {
    const dispatchedDate = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);
    trackingHistory.push({
      timestamp: dispatchedDate.toISOString(),
      description: 'Shipped',
      location: 'Distribution Center',
      status: 'completed'
    });
  }

  if (order.status === 'delivered') {
    const deliveredDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    trackingHistory.push({
      timestamp: deliveredDate.toISOString(),
      description: 'Delivered',
      location: order.delivery_address || 'Your Address',
      status: 'completed'
    });
  }

  return trackingHistory;
}

module.exports = orderController;