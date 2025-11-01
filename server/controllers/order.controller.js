const Order = require("../models/Order.model");
const Product = require("../models/Product.model");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");

// Ensure MongoDB is connected
const ensureConnection = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log('⚠️ MongoDB not connected, attempting to connect...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      dbName: 'agrolink'
    });
  }
  console.log('✅ MongoDB connection verified');
};

const orderController = {
  createOrder: async (req, res) => {
    let session;
    try {
      // Ensure database is connected
      await ensureConnection();
      
      console.log('📦 Starting order creation...');
      
      // First validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation failed:', errors.array());
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { items, deliveryAddress } = req.body;
      
      // Log request details
      console.log('📥 createOrder request details:', {
        items: items?.length || 0,
        hasDeliveryAddress: !!deliveryAddress,
        userId: req.user?._id?.toString() || req.user?.id || null,
      });

      // Validate basic requirements
      if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('❌ Invalid items array');
        return res.status(400).json({ message: "Items array is required and must not be empty" });
      }

      // FIX 1: Check for both validation and business logic field names
      const invalidItems = items.filter(item => !item.product || !item.qty || !item.price);
      if (invalidItems.length > 0) {
        console.log('❌ Invalid item data:', invalidItems);
        return res.status(400).json({ 
          message: "Each item must have product, qty, and price",
          invalidItems
        });
      }

      // Validate quantities are positive numbers
      const invalidQuantities = items.filter(item => !Number.isInteger(item.qty) || item.qty <= 0);
      if (invalidQuantities.length > 0) {
        console.log('❌ Invalid quantities:', invalidQuantities);
        return res.status(400).json({ 
          message: "Quantity must be a positive integer",
          invalidItems: invalidQuantities
        });
      }

      if (!deliveryAddress || deliveryAddress.trim().length < 10) {
        console.log('❌ Invalid delivery address');
        return res.status(400).json({ message: "Delivery address must be at least 10 characters long" });
      }

      if (!req.user || !req.user.id) {
        console.log('❌ No authenticated user found');
        return res.status(401).json({ message: "User authentication required" });
      }

      // Start transaction
      session = await mongoose.startSession();
      await session.startTransaction();
      console.log('✅ Transaction started');

      // Get user ID (support both formats)
      const consumerId = req.user?.id || req.user?._id;
      
      // Get product details and validate
      const productIds = items.map(item => item.product);
      console.log('🔍 Fetching products:', productIds);
      
      const products = await Product.find({ _id: { $in: productIds } })
        .populate('farmer', 'name email')
        .session(session);
      
      if (products.length !== productIds.length) {
        console.log('❌ Some products not found');
        await session.abortTransaction();
        return res.status(404).json({ 
          message: "Some products not found",
          found: products.length,
          requested: productIds.length
        });
      }

      const productMap = products.reduce((map, product) => {
        map[product._id.toString()] = product;
        return map;
      }, {});

      let subtotal = 0;
      const orderItems = [];
      let farmerId = null;

      // First validate all products are from same farmer
      for (const product of products) {
        if (!farmerId) {
          farmerId = product.farmer;
          console.log('👨‍🌾 Order farmer identified:', farmerId);
        } else if (farmerId.toString() !== product.farmer.toString()) {
          console.log('❌ Products from multiple farmers detected');
          // FIX 4: Remove duplicate abortTransaction
          await session.abortTransaction();
          return res.status(400).json({ message: "All items must be from the same farmer" });
        }
      }

      for (const item of items) {
        const product = productMap[item.product.toString()];
        
        if (!product) {
          await session.abortTransaction();
          return res.status(404).json({ message: `Product not found: ${item.product}` });
        }

        if (product.quantityAvailable < item.qty) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Insufficient quantity for ${product.title}. Available: ${product.quantityAvailable}`
          });
        }

        if (product.minOrderQty > item.qty) {
          await session.abortTransaction();
          return res.status(400).json({
            message: `Minimum order quantity for ${product.title} is ${product.minOrderQty}`
          });
        }

        const itemTotal = product.pricePerUnit * item.qty;
        subtotal += itemTotal;

        orderItems.push({
          product: product._id,
          title: product.title,
          qty: item.qty,
          unitPrice: product.pricePerUnit,
          measuringUnit: product.measuringUnit
        });

        product.quantityAvailable -= item.qty;
        await product.save({ session });
      }

      if (!farmerId) {
        await session.abortTransaction();
        return res.status(400).json({ message: "Could not determine farmer for the order" });
      }

      const order = new Order({
        consumer: consumerId,
        farmer: farmerId,
        items: orderItems,
        subtotal,
        deliveryAddress: deliveryAddress.trim(),
        status: "placed"
      });

      console.log('💾 Saving order...', {
        consumerId: order.consumer,
        farmerId: order.farmer,
        itemCount: orderItems.length,
        total: subtotal
      });

      const savedOrder = await order.save({ session });
      
      // Double-check everything saved correctly
      const verifiedOrder = await Order.findById(savedOrder._id)
        .session(session);
        
      if (!verifiedOrder) {
        throw new Error("Order failed to save properly");
      }

      await session.commitTransaction();
      console.log('✅ Transaction committed successfully');

      // Now populate the order with all required details
      const populatedOrder = await Order.findById(savedOrder._id)
        .populate("consumer", "name email phone")
        .populate("farmer", "name email phone")
        .populate("items.product", "title images pricePerUnit measuringUnit");

      if (!populatedOrder) {
        throw new Error("Failed to retrieve saved order");
      }

      // FIX 2 & 3: Remove references to undefined 'orders' variable
      console.log('✅ Order created successfully:', {
        orderId: populatedOrder._id,
        total: populatedOrder.subtotal,
        itemCount: populatedOrder.items.length
      });

      res.status(201).json({
        message: "Order created successfully",
        order: populatedOrder
      });

    } catch (error) {
      console.error('❌ Order creation error:', {
        error: error.message,
        stack: error.stack
      });
      
      if (session) {
        try {
          await session.abortTransaction();
          console.log('✅ Transaction aborted');
        } catch (abortError) {
          console.error('❌ Error aborting transaction:', abortError);
        }
      }

      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Invalid order data', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      } 
      
      if (error.name === 'MongoServerError' && error.code === 11000) {
        return res.status(400).json({ 
          message: 'Duplicate order detected' 
        });
      }

      if (error.message.includes('Product not found') || 
          error.message.includes('Insufficient quantity')) {
        return res.status(400).json({ 
          message: error.message 
        });
      }

      res.status(500).json({ 
        message: 'Server error creating order',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      if (session) {
        try {
          await session.endSession();
          console.log('✅ Session ended');
        } catch (endError) {
          console.error('❌ Error ending session:', endError);
        }
      }
    }
  },

  getConsumerOrders: async (req, res) => {
    try {
      await ensureConnection();

      console.log('📥 Fetching consumer orders:', {
        consumerId: req.user?.id || req.user?._id,
        endpoint: req.originalUrl
      });

      const orders = await Order.find({ consumer: req.user.id })
        .populate("farmer", "name email phone address")
        .populate("items.product", "title images pricePerUnit measuringUnit")
        .sort({ createdAt: -1 });

      console.log('✅ Found consumer orders:', {
        count: orders.length,
        userId: req.user?.id
      });

      // Transform the orders to match the required frontend format
      const transformedOrders = orders.map(order => {
        // Generate order number if not exists
        const orderNumber = order.orderNumber || `ORD-${order.createdAt.getFullYear()}-${order._id.toString().slice(-4).toUpperCase()}`;
        
        // Generate tracking number if not exists
        const trackingNumber = order.trackingNumber || `TRK${order._id.toString().slice(-6).toUpperCase()}`;
        
        // Transform items to match frontend format
        const transformedItems = order.items.map(item => ({
          product: {
            title: item.product?.title || item.title,
            pricePerUnit: item.unitPrice,
            measuringUnit: item.measuringUnit
          },
          quantity: item.qty,
          price: item.unitPrice * item.qty
        }));

        // Generate tracking history based on order status
        const trackingHistory = generateTrackingHistory(order);

        return {
          _id: order._id,
          orderNumber: orderNumber,
          status: order.status,
          totalAmount: order.subtotal,
          createdAt: order.createdAt,
          items: transformedItems,
          trackingNumber: trackingNumber,
          trackingHistory: trackingHistory
        };
      });

      // Return in the exact format expected by frontend
      res.json({
        success: true,
        orders: transformedOrders
      });
    } catch (error) {
      console.error('❌ Error fetching consumer orders:', {
        error: error.message,
        userId: req.user?.id,
        stack: error.stack
      });

      res.status(500).json({ 
        success: false,
        message: "Server error fetching orders",
        error: error.message 
      });
    }
  },

  getFarmerOrders: async (req, res) => {
    try {
      await ensureConnection();

      console.log('📥 Fetching farmer orders:', {
        farmerId: req.user?.id || req.user?._id
      });

      const orders = await Order.find({ farmer: req.user.id })
        .populate("consumer", "name email phone address")
        .populate("items.product", "title images pricePerUnit measuringUnit")
        .sort({ createdAt: -1 });

      console.log('✅ Found farmer orders:', {
        count: orders.length,
        userId: req.user?.id
      });

      res.json({
        success: true,
        orders: orders
      });
    } catch (error) {
      console.error('❌ Error fetching farmer orders:', {
        error: error.message,
        userId: req.user?.id,
        stack: error.stack
      });

      res.status(500).json({ 
        success: false,
        message: "Server error fetching orders",
        error: error.message 
      });
    }
  },

  getOrder: async (req, res) => {
    try {
      await ensureConnection();

      console.log('📥 Fetching order details:', {
        orderId: req.params.id,
        requestedBy: req.user?.id
      });

      const order = await Order.findById(req.params.id)
        .populate("consumer", "name email phone address")
        .populate("farmer", "name email phone address")
        .populate("items.product", "title images pricePerUnit measuringUnit");

      if (!order) {
        console.log('❌ Order not found:', req.params.id);
        return res.status(404).json({ 
          success: false,
          message: "Order not found" 
        });
      }

      if (order.consumer.toString() !== req.user.id &&
          order.farmer.toString() !== req.user.id) {
        console.log('❌ Unauthorized order access attempt:', {
          orderId: req.params.id,
          attemptedBy: req.user.id,
          orderConsumer: order.consumer,
          orderFarmer: order.farmer
        });
        return res.status(403).json({ 
          success: false,
          message: "Not authorized to view this order" 
        });
      }

      console.log('✅ Order details retrieved:', {
        orderId: order._id,
        status: order.status,
        itemCount: order.items.length
      });

      res.json({
        success: true,
        order: order
      });
    } catch (error) {
      console.error('❌ Error fetching order details:', {
        error: error.message,
        orderId: req.params.id,
        stack: error.stack
      });

      res.status(500).json({ 
        success: false,
        message: "Server error fetching order",
        error: error.message
      });
    }
  },

  updateOrderStatus: async (req, res) => {
    try {
      await ensureConnection();
      
      const { id } = req.params;
      const { status } = req.body;
      
      console.log('📥 Updating order status:', {
        orderId: id,
        newStatus: status,
        userId: req.user?.id
      });
      
      const validStatuses = ["placed", "accepted", "packed", "dispatched", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        console.log('❌ Invalid status attempted:', status);
        return res.status(400).json({
          success: false,
          message: "Invalid status",
          validStatuses
        });
      }

      const order = await Order.findById(id);
      if (!order) {
        console.log('❌ Order not found:', id);
        return res.status(404).json({ 
          success: false,
          message: "Order not found" 
        });
      }

      if (order.farmer.toString() !== req.user.id) {
        console.log('❌ Unauthorized status update attempt:', {
          orderId: id,
          attemptedBy: req.user.id,
          orderFarmer: order.farmer
        });
        return res.status(403).json({ 
          success: false,
          message: "Not authorized to update this order" 
        });
      }

      const oldStatus = order.status;
      order.status = status;
      await order.save();

      await order.populate("consumer", "name email phone");
      await order.populate("farmer", "name email phone");
      await order.populate("items.product");

      console.log('✅ Order status updated:', {
        orderId: order._id,
        oldStatus,
        newStatus: status,
        updatedBy: req.user.id
      });

      res.json({
        success: true,
        message: "Order status updated successfully",
        order
      });
    } catch (error) {
      console.error('❌ Error updating order status:', {
        error: error.message,
        orderId: req.params.id,
        stack: error.stack
      });

      res.status(500).json({ 
        success: false,
        message: "Server error updating order status",
        error: error.message
      });
    }
  }
};

// Helper function to generate tracking history based on order status and dates
function generateTrackingHistory(order) {
  const trackingHistory = [];
  const createdAt = new Date(order.createdAt);
  
  // Always start with order placed
  trackingHistory.push({
    timestamp: createdAt.toISOString(),
    description: 'Order placed',
    location: 'Online Store',
    status: 'completed'
  });

  // Add status-based events
  if (['accepted', 'packed', 'dispatched', 'delivered'].includes(order.status)) {
    const acceptedDate = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours after order
    trackingHistory.push({
      timestamp: acceptedDate.toISOString(),
      description: 'Order confirmed',
      location: 'Farm Warehouse',
      status: 'completed'
    });
  }

  if (['packed', 'dispatched', 'delivered'].includes(order.status)) {
    const packedDate = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000); // 4 hours after order
    trackingHistory.push({
      timestamp: packedDate.toISOString(),
      description: 'Order packed',
      location: 'Farm Warehouse',
      status: 'completed'
    });
  }

  if (['dispatched', 'delivered'].includes(order.status)) {
    const dispatchedDate = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000); // 6 hours after order
    trackingHistory.push({
      timestamp: dispatchedDate.toISOString(),
      description: 'Shipped',
      location: 'Distribution Center',
      status: 'completed'
    });
  }

  if (order.status === 'delivered') {
    const deliveredDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours after order
    trackingHistory.push({
      timestamp: deliveredDate.toISOString(),
      description: 'Delivered',
      location: order.deliveryAddress || 'Your Address',
      status: 'completed'
    });
  }

  return trackingHistory;
}

module.exports = orderController;