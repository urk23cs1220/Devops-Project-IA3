import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import PricePredictor from '../components/PricePredictor';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [imageErrors, setImageErrors] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: 'Vegetables',
    pricePerUnit: '',
    measuringUnit: 'kg',
    minOrderQty: '',
    shelfLifeDays: '',
    quantityAvailable: '',
    deliveryRadiusKm: '10'
  });

  // Load farmer's products and orders from API
  useEffect(() => {
    loadFarmerProducts();
    loadFarmerOrders();
  }, []);

  const loadFarmerOrders = async () => {
    try {
      setOrderLoading(true);
      const response = await api.get('/api/orders/farmer');
      
      // Handle different response formats
      let ordersData = [];
      
      if (Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response.data && Array.isArray(response.data.orders)) {
        ordersData = response.data.orders;
      } else if (response.data && Array.isArray(response.data.data)) {
        ordersData = response.data.data;
      } else {
        console.warn('Unexpected orders response format:', response.data);
        // Try to find any array in the response
        const arrayKeys = Object.keys(response.data).filter(key => 
          Array.isArray(response.data[key])
        );
        if (arrayKeys.length > 0) {
          ordersData = response.data[arrayKeys[0]];
        } else {
          ordersData = [];
        }
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setOrderLoading(false);
    }
  };

  const loadFarmerProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products/farmer/my-products');
      
      console.log('📦 Raw products response:', response.data);
      
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else {
        console.warn('Unexpected products response format:', response.data);
        // Try to extract any array from the response
        const arrayKeys = Object.keys(response.data).filter(key => 
          Array.isArray(response.data[key])
        );
        if (arrayKeys.length > 0) {
          productsData = response.data[arrayKeys[0]];
          console.log(`Using products data from property: ${arrayKeys[0]}`);
        } else {
          productsData = [];
        }
      }
      
      console.log('📦 Processed products data:', productsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (productData) => {
    const errors = {};

    if (!productData.title?.trim()) {
      errors.title = 'Product title is required';
    }

    if (!productData.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (!productData.pricePerUnit || parseFloat(productData.pricePerUnit) <= 0) {
      errors.pricePerUnit = 'Valid price is required';
    }

    if (!productData.minOrderQty || parseFloat(productData.minOrderQty) < 1) {
      errors.minOrderQty = 'Minimum order quantity must be at least 1';
    }

    if (!productData.quantityAvailable || parseFloat(productData.quantityAvailable) < 0) {
      errors.quantityAvailable = 'Valid quantity is required';
    }

    if (!productData.shelfLifeDays || parseInt(productData.shelfLifeDays) < 1) {
      errors.shelfLifeDays = 'Shelf life must be at least 1 day';
    }

    if (!productData.deliveryRadiusKm || parseInt(productData.deliveryRadiusKm) < 1) {
      errors.deliveryRadiusKm = 'Delivery radius must be at least 1 km';
    }

    return errors;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      setImageErrors('Maximum 5 images allowed');
      return;
    }

    const invalidFile = files.find(file => 
      !file.type.startsWith('image/') || file.size > 5 * 1024 * 1024
    );
    
    if (invalidFile) {
      setImageErrors('Only image files under 5MB are allowed');
      return;
    }

    setImages([...images, ...files]);
    setImageErrors('');
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validate images
    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    // Validate form fields
    const errors = validateForm(newProduct);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    try {
      // Create form data
      const formData = new FormData();

      // Add product data
      formData.append('title', newProduct.title.trim());
      formData.append('description', newProduct.description.trim());
      formData.append('category', newProduct.category);
      formData.append('measuringUnit', newProduct.measuringUnit);
      formData.append('pricePerUnit', parseFloat(newProduct.pricePerUnit));
      formData.append('minOrderQty', parseFloat(newProduct.minOrderQty));
      formData.append('shelfLifeDays', parseInt(newProduct.shelfLifeDays));
      formData.append('quantityAvailable', parseFloat(newProduct.quantityAvailable));
      formData.append('deliveryRadiusKm', parseInt(newProduct.deliveryRadiusKm));

      // Add images
      images.forEach((image) => {
        formData.append('images', image);
      });

      console.log('🔄 Adding product...');
      const response = await api.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Product API response:', response.data);
      
      // Handle different response formats
      let addedProduct = null;
      
      if (response.data.product) {
        addedProduct = response.data.product;
      } else if (response.data.data) {
        addedProduct = response.data.data;
      } else if (response.data) {
        // If the response itself is the product
        addedProduct = response.data;
      }
      
      if (addedProduct) {
        // Add the new product to the list
        setProducts(prevProducts => [...prevProducts, addedProduct]);
        setShowAddModal(false);
        
        // Reset form
        setNewProduct({
          title: '',
          description: '',
          category: 'Vegetables',
          pricePerUnit: '',
          measuringUnit: 'kg',
          minOrderQty: '',
          shelfLifeDays: '',
          quantityAvailable: '',
          deliveryRadiusKm: '10'
        });
        setImages([]);
        setFormErrors({});
        
        toast.success('Product added successfully!');
      } else {
        // If no product data in response but request was successful
        console.log('✅ Product added successfully (no product data in response)');
        toast.success('Product added successfully!');
        setShowAddModal(false);
        
        // Reset form
        setNewProduct({
          title: '',
          description: '',
          category: 'Vegetables',
          pricePerUnit: '',
          measuringUnit: 'kg',
          minOrderQty: '',
          shelfLifeDays: '',
          quantityAvailable: '',
          deliveryRadiusKm: '10'
        });
        setImages([]);
        setFormErrors({});
        
        // Reload products to get the updated list
        loadFarmerProducts();
      }
      
    } catch (error) {
      console.error('❌ Error adding product:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to add product';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = Object.values(validationErrors).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    setFormErrors({});

    // Validate form fields
    const errors = validateForm(selectedProduct);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    // Validate at least one image
    if (selectedProduct.existingImages.length === 0 && images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    try {
      const formData = new FormData();

      // Add product data
      formData.append('title', selectedProduct.title.trim());
      formData.append('description', selectedProduct.description.trim());
      formData.append('category', selectedProduct.category);
      formData.append('measuringUnit', selectedProduct.measuringUnit);
      formData.append('pricePerUnit', parseFloat(selectedProduct.pricePerUnit));
      formData.append('minOrderQty', parseFloat(selectedProduct.minOrderQty));
      formData.append('shelfLifeDays', parseInt(selectedProduct.shelfLifeDays));
      formData.append('quantityAvailable', parseFloat(selectedProduct.quantityAvailable));
      formData.append('deliveryRadiusKm', parseInt(selectedProduct.deliveryRadiusKm));

      // Add existing images
      formData.append('existingImages', JSON.stringify(selectedProduct.existingImages));

      // Add new images
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await api.put(`/api/products/${selectedProduct._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Product updated successfully:', response.data);
      
      // Handle different response formats
      let updatedProduct = null;
      
      if (response.data.product) {
        updatedProduct = response.data.product;
      } else if (response.data.data) {
        updatedProduct = response.data.data;
      } else if (response.data) {
        updatedProduct = response.data;
      }
      
      if (updatedProduct) {
        // Update the products list with the edited product
        setProducts(products.map(p => 
          p._id === selectedProduct._id ? updatedProduct : p
        ));
      } else {
        // If no product data in response, reload the products list
        loadFarmerProducts();
      }
      
      setShowEditModal(false);
      setSelectedProduct(null);
      setImages([]);
      setFormErrors({});
      
      toast.success('Product updated successfully!');
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/api/products/${productId}`);
        setProducts(products.filter(p => p._id !== productId));
        toast.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success('Order status updated successfully');
      loadFarmerOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'placed': 'warning',
      'accepted': 'info',
      'packed': 'primary',
      'dispatched': 'info',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    const labels = {
      'placed': 'New Order',
      'accepted': 'Accepted',
      'packed': 'Packed',
      'dispatched': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return <Badge bg={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Farmer Dashboard</h2>
          <p className="text-muted">Manage your products and orders</p>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={() => setShowAddModal(true)}>
            + Add New Product
          </Button>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="products">Products</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="orders">Orders</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="ai">
              <span className="me-1">✨</span> AI Insights
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="products">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-2">Loading your products...</p>
              </div>
            ) : (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Your Products</h5>
                  <Badge bg="primary">{products.length} products</Badge>
                </Card.Header>
                <Card.Body>
                  {products.length === 0 ? (
                    <div className="text-center py-4">
                      <p>You haven't added any products yet.</p>
                      <Button variant="success" onClick={() => setShowAddModal(true)}>
                        Add Your First Product
                      </Button>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Available</th>
                          <th>Min Order</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <img
                                  src={product.images?.[0] || '/placeholder-product.jpg'}
                                  alt={product.title}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                  className="me-2 rounded"
                                />
                                <div>
                                  <strong>{product.title}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {product.description && product.description.length > 50 
                                      ? `${product.description.substring(0, 50)}...` 
                                      : product.description
                                    }
                                  </small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge bg="outline-success" text="dark">
                                {product.category}
                              </Badge>
                            </td>
                            <td>₹{product.pricePerUnit}/{product.measuringUnit}</td>
                            <td>{product.quantityAvailable} {product.measuringUnit}</td>
                            <td>{product.minOrderQty} {product.measuringUnit}</td>
                            <td>
                              <Badge bg={product.quantityAvailable > 0 ? 'success' : 'danger'}>
                                {product.quantityAvailable > 0 ? 'In Stock' : 'Out of Stock'}
                              </Badge>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProduct({
                                      ...product,
                                      existingImages: product.images || []
                                    });
                                    setImages([]);
                                    setShowEditModal(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleDeleteProduct(product._id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="orders">
            {orderLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-2">Loading orders...</p>
              </div>
            ) : (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Orders</h5>
                  <Badge bg="primary">{orders.length} orders</Badge>
                </Card.Header>
                <Card.Body>
                  {orders.length === 0 ? (
                    <div className="text-center py-4">
                      <p>No orders received yet.</p>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Customer</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td>
                              #{order._id?.slice(-6) || 'N/A'}
                              <br />
                              <small className="text-muted">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                              </small>
                            </td>
                            <td>
                              <div>
                                <strong>{order.consumer?.name || 'N/A'}</strong>
                                <small className="text-muted d-block">{order.consumer?.email || 'N/A'}</small>
                                <small className="text-muted d-block">{order.consumer?.phone || 'N/A'}</small>
                              </div>
                            </td>
                            <td>
                              {order.items && order.items.map((item, idx) => (
                                <div key={idx} className="mb-1">
                                  <strong>{item.product?.title || item.title || 'Unknown Product'}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {(item.qty ?? item.quantity ?? 0)} {(item.measuringUnit || item.product?.measuringUnit || 'unit')} × ₹{item.unitPrice ?? item.product?.pricePerUnit ?? 0}
                                  </small>
                                </div>
                              ))}
                            </td>
                            <td>
                              <strong>₹{order.subtotal || order.total || 0}</strong>
                              <div className="mt-1">
                                <small className="text-muted">Cash on Delivery</small>
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(order.status)}
                              <div className="mt-2">
                                <Form.Select 
                                  size="sm" 
                                  value={order.status || 'placed'}
                                  onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                >
                                  <option value="placed">Placed</option>
                                  <option value="accepted">Accepted</option>
                                  <option value="packed">Packed</option>
                                  <option value="dispatched">Dispatched</option>
                                  <option value="delivered">Delivered</option>
                                </Form.Select>
                              </div>
                            </td>
                            <td>
                              <div className="d-grid gap-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => {
                                    if (order._id) {
                                      window.open(`/orders/${order._id}`, '_blank');
                                    }
                                  }}
                                >
                                  View Details
                                </Button>
                                {order.status === 'placed' && (
                                  <Button 
                                    variant="outline-success" 
                                    size="sm"
                                    onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                                  >
                                    Accept Order
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            )}
          </Tab.Pane>

          <Tab.Pane eventKey="ai">
            <div className="animate-fadeIn">
              <PricePredictor />
              
              <Row className="mt-4">
                <Col md={12}>
                  <Card className="border-0 shadow-sm bg-light">
                    <Card.Body>
                      <h5>About AI Predictions</h5>
                      <p className="text-muted mb-0">
                        Our AI model analyzes historical price data, seasonal trends, and current market demand to provide estimated pricing. 
                        Use these insights to set competitive prices for your products.
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Add Product Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add New Product</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddProduct}>
          <Modal.Body>
            {/* Image Upload Section */}
            <Form.Group className="mb-3">
              <Form.Label>Product Images *</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                isInvalid={!!imageErrors}
              />
              <Form.Text className="text-muted">
                Select up to 5 images (JPG, PNG, GIF, max 5MB each)
              </Form.Text>
              <Form.Control.Feedback type="invalid">
                {imageErrors}
              </Form.Control.Feedback>
              
              {/* Image Previews */}
              <Row className="mt-2">
                {images.map((file, idx) => (
                  <Col key={idx} xs={6} md={4} lg={3} className="mb-2">
                    <div className="position-relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${idx + 1}`}
                        className="img-thumbnail w-100"
                        style={{ aspectRatio: '1/1', objectFit: 'cover' }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-1"
                        onClick={() => removeImage(idx)}
                      >
                        ×
                      </Button>
                    </div>
                  </Col>
                ))}
              </Row>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                    isInvalid={!!formErrors.title}
                    required
                    placeholder="e.g., Organic Tomatoes"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.title}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    required
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Rice">Rice</option>
                    <option value="Grains">Grains</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Spices">Spices</option>
                    <option value="Other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                isInvalid={!!formErrors.description}
                required
                placeholder="Describe your product in detail..."
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newProduct.pricePerUnit}
                    onChange={(e) => setNewProduct({...newProduct, pricePerUnit: e.target.value})}
                    isInvalid={!!formErrors.pricePerUnit}
                    required
                    placeholder="0.00"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.pricePerUnit}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Price per unit
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit *</Form.Label>
                  <Form.Select
                    value={newProduct.measuringUnit}
                    onChange={(e) => setNewProduct({...newProduct, measuringUnit: e.target.value})}
                    required
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="packet">packet</option>
                    <option value="bunch">bunch</option>
                    <option value="piece">piece</option>
                    <option value="litre">litre</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Order Qty *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={newProduct.minOrderQty}
                    onChange={(e) => setNewProduct({...newProduct, minOrderQty: e.target.value})}
                    isInvalid={!!formErrors.minOrderQty}
                    required
                    placeholder="1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.minOrderQty}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Shelf Life (Days) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={newProduct.shelfLifeDays}
                    onChange={(e) => setNewProduct({...newProduct, shelfLifeDays: e.target.value})}
                    isInvalid={!!formErrors.shelfLifeDays}
                    required
                    placeholder="7"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.shelfLifeDays}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity Available *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1"
                    value={newProduct.quantityAvailable}
                    onChange={(e) => setNewProduct({...newProduct, quantityAvailable: e.target.value})}
                    isInvalid={!!formErrors.quantityAvailable}
                    required
                    placeholder="100"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.quantityAvailable}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Delivery Radius (km) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={newProduct.deliveryRadiusKm}
                    onChange={(e) => setNewProduct({...newProduct, deliveryRadiusKm: e.target.value})}
                    isInvalid={!!formErrors.deliveryRadiusKm}
                    required
                    placeholder="10"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.deliveryRadiusKm}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              Add Product
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Product Title</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedProduct.title}
                  onChange={(e) => setSelectedProduct({
                    ...selectedProduct,
                    title: e.target.value
                  })}
                  isInvalid={!!formErrors.title}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.title}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={selectedProduct.description}
                  onChange={(e) => setSelectedProduct({
                    ...selectedProduct,
                    description: e.target.value
                  })}
                  isInvalid={!!formErrors.description}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.description}
                </Form.Control.Feedback>
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category</Form.Label>
                    <Form.Select
                      value={selectedProduct.category}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        category: e.target.value
                      })}
                    >
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Grains">Grains</option>
                      <option value="Dairy">Dairy</option>
                      <option value="Others">Others</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price per Unit (₹)</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={selectedProduct.pricePerUnit}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        pricePerUnit: e.target.value
                      })}
                      isInvalid={!!formErrors.pricePerUnit}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.pricePerUnit}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Unit</Form.Label>
                    <Form.Select
                      value={selectedProduct.measuringUnit}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        measuringUnit: e.target.value
                      })}
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="l">Liter (l)</option>
                      <option value="ml">Milliliter (ml)</option>
                      <option value="piece">Piece</option>
                      <option value="dozen">Dozen</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Order Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      step="1"
                      value={selectedProduct.minOrderQty}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        minOrderQty: e.target.value
                      })}
                      isInvalid={!!formErrors.minOrderQty}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.minOrderQty}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Available Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="1"
                      value={selectedProduct.quantityAvailable}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        quantityAvailable: e.target.value
                      })}
                      isInvalid={!!formErrors.quantityAvailable}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.quantityAvailable}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Shelf Life (days)</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      step="1"
                      value={selectedProduct.shelfLifeDays}
                      onChange={(e) => setSelectedProduct({
                        ...selectedProduct,
                        shelfLifeDays: e.target.value
                      })}
                      isInvalid={!!formErrors.shelfLifeDays}
                    />
                    <Form.Control.Feedback type="invalid">
                      {formErrors.shelfLifeDays}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Delivery Radius (km)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  step="1"
                  value={selectedProduct.deliveryRadiusKm}
                  onChange={(e) => setSelectedProduct({
                    ...selectedProduct,
                    deliveryRadiusKm: e.target.value
                  })}
                  isInvalid={!!formErrors.deliveryRadiusKm}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.deliveryRadiusKm}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Images</Form.Label>
                <div className="mb-2">
                  <small className="text-muted">Current images:</small>
                  <div className="d-flex gap-2 mb-2">
                    {selectedProduct.existingImages.map((image, index) => (
                      <div key={index} className="position-relative">
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          className="rounded"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          className="position-absolute top-0 end-0"
                          onClick={() => {
                            setSelectedProduct({
                              ...selectedProduct,
                              existingImages: selectedProduct.existingImages.filter((_, i) => i !== index)
                            });
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imageErrors && <Alert variant="danger" className="mt-2">{imageErrors}</Alert>}
                {images.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">New images to upload:</small>
                    <div className="d-flex gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="position-relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`New ${index + 1}`}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            className="rounded"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditProduct}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FarmerDashboard;