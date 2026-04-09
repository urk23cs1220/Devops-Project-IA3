require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const supabase = require('./config/supabase');

const app = express();

// Middleware

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Log directory creation
console.log('📁 Uploads directory:', {
  path: uploadsDir,
  exists: fs.existsSync(uploadsDir),
  writable: fs.accessSync(uploadsDir, fs.constants.W_OK) || true
});

// Serve uploaded product images statically with caching disabled for development
app.use('/uploads', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  etag: false
}));
console.log('📡 Serving static files from:', path.join(__dirname, 'uploads'));

// Log static file requests in development
app.use('/uploads', (req, res, next) => {
  console.log('📸 Image request:', req.url);
  next();
});

// Test route
app.get('/', (req, res) => {
  res.send('🚀 Agro-Link Server is running! (Express + MongoDB + CORS)');
});

// Test API
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Hello from Agro-Link Express + MongoDB + CORS!",
    status: "Server is running successfully",
    timestamp: new Date().toISOString()
  });
});

// Supabase logic is handled inline in this file or imported from controllers

// Import routes
const productRoutes = require('./routes/products.routes');
const orderRoutes = require('./routes/orders.routes');
const debugRoutes = require('./routes/debug.routes');

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
// Debug routes - only in development
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRoutes);
}

// AUTH ROUTES - Supabase Implementation
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    console.log('✅ Signup attempt:', { name, email, role });

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();
      
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user 
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password_hash: password, // For demo, using plain password
        role: role || 'consumer',
        phone: phone || '',
        address: address || '',
        location: { type: 'Point', coordinates: [0, 0] }
      }])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ User saved to Supabase:', user.id);

    res.json({
      message: 'Signup successful!',
      token: `demo-token:::${user.id}:::${Date.now()}`,
      user: {
        id: user.id,
        _id: user.id, // for frontend backwards compatibility
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Signup error', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('✅ Login attempt:', { email });
    
    // Find user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Simple password check
    if (user.password_hash !== password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const response = {
      message: 'Login successful!',
      token: `demo-token:::${user.id}:::${Date.now()}`,
      user: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || ''
      }
    };

    console.log('✅ Login successful, returning:', user.id);
    res.json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  console.log('✅ Logout request');
  res.json({ message: 'Logout successful' });
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const raw = req.header('Authorization') || '';
    const token = raw.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (token.startsWith('demo-token:::')) {
      const parts = token.split(':::');
      const possibleId = parts[1]; // Index 1 is the ID after 'demo-token'
      if (possibleId) {
        const { data: userById, error } = await supabase
          .from('users')
          .select('id, name, email, role, phone, address, location')
          .eq('id', possibleId)
          .single();
          
        if (!error && userById) {
          userById._id = userById.id;
          return res.json({ user: userById });
        }
      }
    }

    // No fallback - if token is invalid or user not found, return unauthorized
    return res.status(401).json({ message: 'Token is invalid or session expired' });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// PRODUCT ROUTES (mapped to Supabase)
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 Fetching all products');
    
    // Join with users table to get farmer details
    const { data: products, error } = await supabase
      .from('products')
      .select('*, farmer:users(id, name, email)');
      
    if (error) throw error;
    
    // map id to _id
    const mappedProducts = products.map(p => ({
      ...p,
      _id: p.id,
      farmer: p.farmer ? { ...p.farmer, _id: p.farmer.id } : null
    }));

    res.json({
      products: mappedProducts.length > 0 ? mappedProducts : [
        {
          _id: 'demo-product-1',
          id: 'demo-product-1',
          title: 'Organic Tomatoes',
          description: 'Fresh organic tomatoes from local farm',
          category: 'Vegetables',
          pricePerUnit: 80,
          measuringUnit: 'kg',
          minOrderQty: 1,
          quantityAvailable: 50,
          shelfLifeDays: 7,
          deliveryRadiusKm: 20,
          farmer: {
            _id: 'demo-farmer-1',
            name: 'Demo Farmer',
            email: 'farmer@demo.com'
          },
          images: []
        }
      ],
      totalPages: 1,
      currentPage: 1,
      total: mappedProducts.length > 0 ? mappedProducts.length : 1
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    console.log('📦 Creating product:', req.body);
    
    // Get a farmer user from database to associate with the product
    const { data: farmerUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'farmer')
      .limit(1)
      .single();
      
    const farmerId = farmerUser ? farmerUser.id : null;

    if (!farmerId) {
      return res.status(400).json({ message: 'No farmer found to associate product with.' });
    }

    const productData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price_per_unit: req.body.pricePerUnit,
      measuring_unit: req.body.measuringUnit,
      min_order_qty: req.body.minOrderQty,
      shelf_life_days: req.body.shelfLifeDays,
      quantity_available: req.body.quantityAvailable,
      delivery_radius_km: req.body.deliveryRadiusKm,
      farmer_id: farmerId,
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      images: []
    };

    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*, farmer:users(id, name, email)')
      .single();

    if (error) throw error;

    product._id = product.id;
    if (product.farmer) product.farmer._id = product.farmer.id;

    res.status(201).json({
      message: 'Product created successfully!',
      product: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      message: 'Error creating product',
      error: error.message 
    });
  }
});

app.get('/api/products/farmer/my-products', async (req, res) => {
  try {
    console.log('👨‍🌾 Fetching farmer products');
    
    const { data: farmerUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'farmer')
      .limit(1)
      .single();
      
    if (!farmerUser) return res.json([]);

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('farmer_id', farmerUser.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mappedProducts = products.map(p => ({ ...p, _id: p.id }));

    res.json(mappedProducts);
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({ message: 'Error fetching farmer products' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    console.log('🗑️ Deleting product:', req.params.id);
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);
      
    if (error) throw error;
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'Agro-Link API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Simple weather API
app.get('/api/utils/weather', (req, res) => {
  res.json({
    location: "Demo Location",
    temperature: 25,
    description: "Sunny",
    humidity: 65,
    windSpeed: 12,
    icon: "☀️",
    message: "Weather API is working (demo mode)"
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET  /',
      'GET  /api/test',
      'GET  /api/health',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET  /api/auth/me',
      'GET  /api/products',
      'POST /api/products',
      'GET  /api/products/farmer/my-products',
      'DELETE /api/products/:id',
      'GET  /api/utils/weather'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 CORS enabled for all origins`);
  console.log(`🔐 Available endpoints:`);
  console.log(`   AUTH: POST /api/auth/signup, /api/auth/login, /api/auth/logout`);
  console.log(`   PRODUCTS: GET /api/products, POST /api/products, GET /api/products/farmer/my-products`);
  console.log(`   UTILS: GET /api/utils/weather`);
});