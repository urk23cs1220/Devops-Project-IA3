import React, { useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, orderTotal } = location.state || {};

  useEffect(() => {
    // Show success message
    toast.success('Order placed successfully!');
  }, []);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body className="p-5">
              <div className="text-success mb-4" style={{ fontSize: '4rem' }}>
                ✅
              </div>
              <h2 className="mb-3">Order Placed Successfully!</h2>
              <p className="text-muted mb-4">
                Thank you for your order. Your order has been confirmed and will be processed shortly.
                You will receive a confirmation email with your order details.
              </p>
              
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="mb-2">Order Details</h6>
                <p className="mb-1">
                  <strong>Order Number:</strong> {orderId || 'ORD-2024-003'}
                </p>
                <p className="mb-1">
                  <strong>Estimated Delivery:</strong> 2-3 business days
                </p>
                <p className="mb-0">
                  <strong>Total Amount:</strong> ₹{orderTotal || '90.00'}
                </p>
              </div>

              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <Button as={Link} to="/orders" variant="success" size="lg">
                  View Your Orders
                </Button>
                <Button as={Link} to="/products" variant="outline-success" size="lg">
                  Continue Shopping
                </Button>
                <Button 
                  as={Link} 
                  to="/consumer/dashboard" 
                  variant="outline-primary" 
                  size="lg"
                >
                  Back to Dashboard
                </Button>
              </div>

              <div className="mt-4 pt-3 border-top">
                <p className="text-muted small mb-2">
                  Need help with your order?
                </p>
                <Button variant="link" size="sm" className="text-decoration-none">
                  Contact Support
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderSuccess;