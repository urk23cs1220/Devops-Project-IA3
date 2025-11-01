import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching orders from API...');
      const response = await api.get('/api/orders/my-orders');
      console.log('✅ Orders API response:', response.data);
      
      if (response.data && response.data.success && response.data.orders) {
        setOrders(response.data.orders);
        console.log(`📦 Loaded ${response.data.orders.length} orders`);
      } else {
        console.log('❌ No orders found in response');
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      setError('Failed to load orders. Please try again later.');
      toast.error('Failed to load your orders');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading your orders...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Your Orders</h2>
              <p className="text-muted">View your order history and track deliveries</p>
            </div>
            <Button as={Link} to="/products" variant="success">
              Continue Shopping
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button 
            variant="outline-danger" 
            size="sm" 
            className="ms-3"
            onClick={fetchOrders}
          >
            Try Again
          </Button>
        </Alert>
      )}

      {orders.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <div className="empty-icon mb-3" style={{ fontSize: '4rem' }}>📦</div>
            <h4>No Orders Yet</h4>
            <p className="text-muted mb-4">You haven't placed any orders yet. Start shopping to see your orders here.</p>
            <Button as={Link} to="/products" variant="success" size="lg">
              Start Shopping
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Orders Summary */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-primary">{orders.length}</h5>
                  <p className="text-muted mb-0">Total Orders</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-success">
                    {orders.filter(order => order.status === 'delivered').length}
                  </h5>
                  <p className="text-muted mb-0">Delivered</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-warning">
                    {orders.filter(order => ['pending', 'placed', 'confirmed', 'accepted'].includes(order.status)).length}
                  </h5>
                  <p className="text-muted mb-0">Processing</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-info">
                    {orders.filter(order => ['packed', 'dispatched', 'shipped'].includes(order.status)).length}
                  </h5>
                  <p className="text-muted mb-0">Shipped</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Orders Table */}
          <Card>
            <Card.Header className="bg-light">
              <h5 className="mb-0">Order History</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Tracking #</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <small>
                          {order.items && order.items.length > 0 
                            ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}`
                            : 'No items'
                          }
                        </small>
                      </td>
                      <td>
                        <strong>{formatCurrency(order.totalAmount || order.subtotal)}</strong>
                      </td>
                      <td>
                        <Badge bg={getStatusVariant(order.status)}>
                          {order.status?.toUpperCase() || 'PENDING'}
                        </Badge>
                      </td>
                      <td>
                        <code>{order.trackingNumber || 'N/A'}</code>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            as={Link}
                            to={`/orders/${order._id}`}
                            variant="outline-primary" 
                            size="sm"
                          >
                            View
                          </Button>
                          {order.status === 'delivered' && (
                            <Button variant="outline-success" size="sm">
                              Reorder
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Order Cards for Mobile View */}
          <div className="d-md-none mt-4">
            {orders.map((order) => (
              <Card key={order._id} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0">{order.orderNumber}</h6>
                    <Badge bg={getStatusVariant(order.status)}>
                      {order.status?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                  <p className="text-muted small mb-2">
                    {formatDate(order.createdAt)}
                  </p>
                  <p className="fw-bold text-success mb-2">
                    {formatCurrency(order.totalAmount || order.subtotal)}
                  </p>
                  <p className="small mb-2">
                    <strong>Tracking:</strong> {order.trackingNumber || 'N/A'}
                  </p>
                  <p className="small text-muted mb-3">
                    {order.items && order.items.length > 0 
                      ? `${order.items.length} item${order.items.length > 1 ? 's' : ''}`
                      : 'No items'
                    }
                  </p>
                  <div className="d-flex gap-2">
                    <Button 
                      as={Link}
                      to={`/orders/${order._id}`}
                      variant="outline-primary" 
                      size="sm"
                    >
                      View Details
                    </Button>
                    {order.status === 'delivered' && (
                      <Button variant="outline-success" size="sm">
                        Reorder
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </>
      )}
    </Container>
  );
};

export default Orders;