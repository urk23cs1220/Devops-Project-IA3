import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/orders/${orderId}`);
      console.log('✅ Order details response:', response.data);
      
      if (response.data && response.data.success) {
        setOrder(response.data.order);
      } else {
        setError('Order not found');
      }
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      setError('Failed to load order details');
      toast.error('Failed to load order details');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
        <p className="mt-2">Loading order details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button as={Link} to="/orders" variant="primary">
              Back to Orders
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Order not found
          <div className="mt-3">
            <Button as={Link} to="/orders" variant="primary">
              Back to Orders
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Order Details</h2>
              <p className="text-muted">Order #{order.orderNumber}</p>
            </div>
            <Button as={Link} to="/orders" variant="outline-primary">
              Back to Orders
            </Button>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Items</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{item.product?.title || item.title}</strong>
                        <br />
                        <small className="text-muted">
                          {item.measuringUnit} • {formatCurrency(item.unitPrice || item.pricePerUnit)} each
                        </small>
                      </td>
                      <td>{item.qty || item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice || item.pricePerUnit)}</td>
                      <td>
                        <strong>
                          {formatCurrency((item.unitPrice || item.pricePerUnit) * (item.qty || item.quantity))}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td><strong>{formatCurrency(order.totalAmount || order.subtotal)}</strong></td>
                  </tr>
                </tfoot>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Information</h5>
            </Card.Header>
            <Card.Body>
              <p>
                <strong>Order Number:</strong><br />
                {order.orderNumber}
              </p>
              <p>
                <strong>Order Date:</strong><br />
                {formatDate(order.createdAt)}
              </p>
              <p>
                <strong>Status:</strong><br />
                <Badge bg={getStatusVariant(order.status)}>
                  {order.status?.toUpperCase()}
                </Badge>
              </p>
              <p>
                <strong>Tracking Number:</strong><br />
                {order.trackingNumber || 'Not available'}
              </p>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Delivery Address</h5>
            </Card.Header>
            <Card.Body>
              <p>{order.deliveryAddress}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderDetails;