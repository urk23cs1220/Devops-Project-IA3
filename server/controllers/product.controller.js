const supabase = require('../config/supabase');

exports.getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    
    let query = supabase.from('products').select('*, farmer:users!products_farmer_id_fkey(id, name, email, phone, address)', { count: 'exact' });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: products, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const mappedProducts = products.map(p => ({ ...p, _id: p.id }));

    res.json({
      products: mappedProducts,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: parseInt(page),
      total: count || 0
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, farmer:users!products_farmer_id_fkey(id, name, email, phone, address)')
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    product._id = product.id;
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const requiredFields = ['title', 'description', 'category', 'pricePerUnit', 
                          'measuringUnit', 'minOrderQty', 'shelfLifeDays', 
                          'quantityAvailable', 'deliveryRadiusKm'];
    
    for (const field of requiredFields) {
      if (!req.body[field]) return res.status(400).json({ message: `${field} is required` });
    }

    const images = (req.files || []).map(file => {
      return `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`;
    });

    const productData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price_per_unit: parseFloat(req.body.pricePerUnit),
      measuring_unit: req.body.measuringUnit,
      min_order_qty: parseInt(req.body.minOrderQty),
      shelf_life_days: parseInt(req.body.shelfLifeDays),
      quantity_available: parseInt(req.body.quantityAvailable),
      delivery_radius_km: parseInt(req.body.deliveryRadiusKm),
      farmer_id: req.user.id || req.user._id,
      images: images,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] }
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*, farmer:users!products_farmer_id_fkey(id, name, email, phone, address)')
      .single();

    if (error) throw error;
    product._id = product.id;

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (findError || !product) return res.status(404).json({ message: 'Product not found' });

    const userId = req.user.id || req.user._id;
    if (product.farmer_id !== userId) return res.status(403).json({ message: 'Access denied' });

    let existingImages = [];
    try {
      existingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    } catch (_e) {
      existingImages = [];
    }

    let images = existingImages;
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
      images = [...images, ...newImages];
    }

    const updatedData = {
      title: req.body.title || product.title,
      description: req.body.description || product.description,
      category: req.body.category || product.category,
      measuring_unit: req.body.measuringUnit || product.measuring_unit,
      price_per_unit: req.body.pricePerUnit ? parseFloat(req.body.pricePerUnit) : product.price_per_unit,
      min_order_qty: req.body.minOrderQty ? parseInt(req.body.minOrderQty) : product.min_order_qty,
      shelf_life_days: req.body.shelfLifeDays ? parseInt(req.body.shelfLifeDays) : product.shelf_life_days,
      quantity_available: req.body.quantityAvailable ? parseInt(req.body.quantityAvailable) : product.quantity_available,
      delivery_radius_km: req.body.deliveryRadiusKm ? parseInt(req.body.deliveryRadiusKm) : product.delivery_radius_km,
      images: images
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updatedData)
      .eq('id', req.params.id)
      .select('*, farmer:users!products_farmer_id_fkey(id, name, email, phone, address)')
      .single();

    if (updateError) throw updateError;
    updatedProduct._id = updatedProduct.id;

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { data: product, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (findError || !product) return res.status(404).json({ message: 'Product not found' });

    const userId = req.user.id || req.user._id;
    if (product.farmer_id !== userId) return res.status(403).json({ message: 'Access denied' });

    const { error: deleteError } = await supabase.from('products').delete().eq('id', req.params.id);
    if (deleteError) throw deleteError;

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

exports.getFarmerProducts = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const mappedProducts = products.map(p => ({ ...p, _id: p.id }));

    res.json(mappedProducts);
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};