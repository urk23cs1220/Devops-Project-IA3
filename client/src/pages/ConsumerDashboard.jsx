import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const ConsumerDashboard = () => {
  const [recentProducts, setRecentProducts] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch recent products
      const productsResponse = await api.get('/api/products?limit=3');
      console.log('✅ Consumer dashboard products:', productsResponse.data);
      setRecentProducts(productsResponse.data.products?.slice(0, 3) || []);
      
      // Fetch user orders
      await fetchUserOrders();
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      setOrdersLoading(true);
      
      // Try to fetch from API first
      const ordersResponse = await api.get('/api/orders/my-orders');
      console.log('✅ User orders API response:', ordersResponse.data);
      
      if (ordersResponse.data && ordersResponse.data.success && ordersResponse.data.orders) {
        setUserOrders(ordersResponse.data.orders);
      } else {
        // If no orders found, set empty array
        console.log('📦 No orders found in API response');
        setUserOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      
      // Don't use mock data - set empty array instead
      console.log('🔄 API failed, showing empty orders');
      setUserOrders([]);
      
      // Show specific error message
      if (error.response?.status === 500) {
        toast.error('Server error: Could not load orders');
      } else if (error.response?.status === 404) {
        // No orders found is normal for new users
        setUserOrders([]);
      } else {
        toast.error('Failed to load orders from server');
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  const trackOrder = async (e) => {
    if (e) e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setTrackingLoading(true);
    try {
      // Try to fetch from API first
      try {
        const trackingResponse = await api.get(`/api/orders/track/${trackingNumber}`);
        if (trackingResponse.data) {
          setTrackedOrder(trackingResponse.data);
          toast.success('Order found!');
          return;
        }
      } catch (apiError) {
        console.log('🔍 API tracking failed, checking local orders...');
      }
      
      // Fallback to local search
      const foundOrder = userOrders.find(order => 
        order.trackingNumber?.toLowerCase() === trackingNumber.toLowerCase()
      );
      
      if (foundOrder) {
        setTrackedOrder(foundOrder);
        toast.success('Order found!');
      } else {
        setTrackedOrder(null);
        toast.error('Order not found. Please check your tracking number.');
      }
    } catch (error) {
      console.error('❌ Error tracking order:', error);
      toast.error('Failed to track order');
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    const variants = {
      'pending': 'warning',
      'placed': 'info',
      'confirmed': 'info',
      'accepted': 'primary',
      'packed': 'primary',
      'dispatched': 'primary',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return variants[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current date for dashboard display
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Consumer Dashboard</h2>
          <p className="text-muted">Welcome to your shopping dashboard! Today is {getCurrentDate()}</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="ms-3"
            onClick={fetchDashboardData}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon mb-3">🛒</div>
              <Card.Title>Browse Products</Card.Title>
              <Card.Text className="flex-grow-1">
                Shop fresh produce from local farmers
              </Card.Text>
              <Button as={Link} to="/products" variant="success" className="mt-auto">
                Shop Now
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon mb-3">📦</div>
              <Card.Title>Your Orders</Card.Title>
              <Card.Text className="flex-grow-1">
                View your order history and track deliveries
              </Card.Text>
              <Button as={Link} to="/orders" variant="success" className="mt-auto">
                View Orders
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon mb-3">👤</div>
              <Card.Title>Profile</Card.Title>
              <Card.Text className="flex-grow-1">
                Manage your account and delivery preferences
              </Card.Text>
              <Button as={Link} to="/profile" variant="outline-primary" className="mt-auto">
                Edit Profile
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Tracking Section */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Track Your Order</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <form onSubmit={trackOrder}>
                    <div className="d-flex gap-2 mb-3">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter tracking number (e.g., TRK123456)"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        disabled={trackingLoading}
                      />
                      <Button 
                        variant="success" 
                        type="submit"
                        disabled={trackingLoading}
                      >
                        {trackingLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Tracking...
                          </>
                        ) : (
                          'Track Order'
                        )}
                      </Button>
                    </div>
                  </form>
                  <p className="text-muted small">
                    Enter your tracking number to see the current status and delivery timeline
                  </p>
                </Col>
                <Col md={6}>
                  <div className="border-start ps-3">
                    <h6>Quick Links</h6>
                    <div className="d-flex flex-wrap gap-2">
                      <Button 
                        as={Link} 
                        to="/orders" 
                        variant="outline-primary" 
                        size="sm"
                      >
                        View Order History
                      </Button>
                      <Button 
                        as={Link} 
                        to="/support" 
                        variant="outline-secondary" 
                        size="sm"
                      >
                        Get Help
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Tracked Order Details */}
              {trackedOrder && (
                <div className="mt-4 p-3 border rounded">
                  <Row className="align-items-center mb-3">
                    <Col>
                      <h6 className="mb-1">Order #{trackedOrder.orderNumber}</h6>
                      <small className="text-muted">
                        Placed on {formatDate(trackedOrder.createdAt)}
                      </small>
                    </Col>
                    <Col xs="auto">
                      <Badge bg={getStatusVariant(trackedOrder.status)}>
                        {trackedOrder.status?.toUpperCase()}
                      </Badge>
                    </Col>
                  </Row>

                  {/* Tracking Timeline */}
                  {trackedOrder.trackingHistory && (
                    <div className="timeline">
                      {trackedOrder.trackingHistory.map((event, index) => (
                        <div key={index} className="timeline-event d-flex mb-3">
                          <div className="timeline-marker me-3">
                            <div className="bg-success rounded-circle" style={{ width: '12px', height: '12px' }}></div>
                          </div>
                          <div className="timeline-content flex-grow-1">
                            <h6 className="mb-1">{event.description}</h6>
                            <p className="text-muted small mb-1">{event.location}</p>
                            <small className="text-muted">
                              {formatDateTime(event.timestamp)}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <Button 
                      as={Link} 
                      to={`/orders/${trackedOrder._id}`}
                      variant="outline-success" 
                      size="sm"
                    >
                      View Full Order Details
                    </Button>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders Preview */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Orders</h5>
              <Button as={Link} to="/orders" variant="outline-primary" size="sm">
                View All ({userOrders.length})
              </Button>
            </Card.Header>
            <Card.Body>
              {ordersLoading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" size="sm" />
                  <p className="mt-2">Loading orders...</p>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No orders yet</p>
                  <Button as={Link} to="/products" variant="success">
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <Row>
                  {userOrders.slice(0, 3).map((order) => (
                    <Col md={4} key={order._id} className="mb-3">
                      <Card className="h-100 border">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{order.orderNumber}</h6>
                            <Badge bg={getStatusVariant(order.status)}>
                              {order.status?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-muted small mb-2">
                            {formatDate(order.createdAt)}
                          </p>
                          <p className="fw-bold text-success mb-2">
                            ₹{order.totalAmount || order.subtotal}
                          </p>
                          <div className="mb-2">
                            {order.items?.slice(0, 2).map((item, index) => (
                              <small key={index} className="d-block text-muted">
                                • {item.product?.title || item.title} (x{item.quantity || item.qty})
                              </small>
                            ))}
                            {order.items?.length > 2 && (
                              <small className="text-muted">
                                +{order.items.length - 2} more items
                              </small>
                            )}
                          </div>
                          <div className="d-flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => {
                                setTrackingNumber(order.trackingNumber);
                                trackOrder();
                              }}
                            >
                              Track
                            </Button>
                            <Button 
                              as={Link} 
                              to={`/orders/${order._id}`}
                              size="sm" 
                              variant="outline-success"
                            >
                              Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Products */}
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Recently Added Products</h5>
            </Card.Header>
            <Card.Body>
              {recentProducts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No products available yet</p>
                  <Button as={Link} to="/products" variant="outline-success">
                    Browse All Products
                  </Button>
                </div>
              ) : (
                <Row>
                  {recentProducts.map((product) => (
                    <Col md={4} key={product._id} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="d-flex flex-column">
                          <Card.Title className="h6">{product.title}</Card.Title>
                          <Card.Text className="text-muted small flex-grow-1">
                            {product.category} • {product.farmer?.name || 'Local Farmer'}
                          </Card.Text>
                          <div className="mt-auto">
                            <p className="text-success fw-bold mb-2">
                              ₹{product.pricePerUnit}/{product.measuringUnit}
                            </p>
                            <Button 
                              as={Link} 
                              to={`/products/${product._id}`}
                              variant="outline-success" 
                              size="sm"
                              className="w-100"
                            >
                              View Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
              <div className="text-center mt-3">
                <Button as={Link} to="/products" variant="success">
                  View All Products
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ConsumerDashboard;