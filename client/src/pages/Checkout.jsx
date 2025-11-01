import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    paymentMethod: 'cash',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { deliveryAddress } = formData;
    
    // Check delivery address length (at least 10 characters)
    if (!deliveryAddress || deliveryAddress.length < 10) {
      toast.error('Delivery address must be at least 10 characters long');
      return false;
    }
    
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }

    // Check if all items are from the same farmer
    const farmerIds = [...new Set(cartItems.map(item => item.product.farmer?._id))];
    if (farmerIds.length > 1) {
      toast.error('All items in cart must be from the same farmer');
      return false;
    }

    return true;
  };

  const formatDeliveryAddress = () => {
    // Create a formatted address string from individual fields
    const addressParts = [
      formData.street,
      formData.city,
      formData.state,
      formData.zipCode,
      formData.country
    ].filter(part => part && part.trim() !== '');
    
    return addressParts.join(', ');
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // CORRECTED ORDER DATA STRUCTURE - matches backend validation
      const orderData = {
        items: cartItems.map(item => ({
          product: item.product._id,  // ✅ Use 'product' not 'productId'
          qty: item.quantity,         // ✅ Use 'qty' not 'quantity'  
          price: item.product.pricePerUnit,
          // ✅ Don't send farmerId - backend will get it from the product
        })),
        totalAmount: getCartTotal(),
        deliveryAddress: formData.deliveryAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };

      console.log('🛒 Creating order with corrected data structure:', orderData);

      const response = await api.post('/api/orders', orderData);
      
      toast.success('Order placed successfully!');
      clearCart();
      navigate('/order-success', { 
        state: { 
          orderId: response.data.order._id, // Updated to response.data.order
          orderTotal: getCartTotal()
        }
      });
      
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      
      // Show specific error message from server
      if (error.response?.data?.message) {
        toast.error(`Order failed: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        const errorMessage = validationErrors.map(err => err.msg).join(', ');
        toast.error(`Validation error: ${errorMessage}`);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">
          <h4>Your cart is empty</h4>
          <p>Add some products to proceed with checkout.</p>
          <Button variant="success" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Delivery Information</h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Complete Delivery Address *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your complete delivery address (at least 10 characters). Example: 3rd year boys, Jerry Manuel hostel, Karunya Nagar, Coimbatore, Tamil Nadu 641114, India"
                    minLength={10}
                    isInvalid={formData.deliveryAddress && formData.deliveryAddress.length < 10}
                  />
                  <Form.Text className="text-muted">
                    Please provide your complete address including street, city, state, and ZIP code.
                    Minimum 10 characters required.
                  </Form.Text>
                  {formData.deliveryAddress && formData.deliveryAddress.length < 10 && (
                    <Form.Control.Feedback type="invalid">
                      Address must be at least 10 characters long
                    </Form.Control.Feedback>
                  )}
                </Form.Group>

                {/* Optional: Keep individual fields for better UX but combine them */}
                <hr />
                <h6>Or fill individual fields to auto-generate address:</h6>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Street Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="street"
                        value={formData.street || ''}
                        onChange={handleInputChange}
                        placeholder="Enter street address"
                        onBlur={() => {
                          if (formData.street || formData.city || formData.state) {
                            setFormData(prev => ({
                              ...prev,
                              deliveryAddress: formatDeliveryAddress()
                            }));
                          }
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city || ''}
                        onChange={handleInputChange}
                        placeholder="Enter city"
                        onBlur={() => {
                          if (formData.street || formData.city || formData.state) {
                            setFormData(prev => ({
                              ...prev,
                              deliveryAddress: formatDeliveryAddress()
                            }));
                          }
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        type="text"
                        name="state"
                        value={formData.state || ''}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                        onBlur={() => {
                          if (formData.street || formData.city || formData.state) {
                            setFormData(prev => ({
                              ...prev,
                              deliveryAddress: formatDeliveryAddress()
                            }));
                          }
                        }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>ZIP Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="zipCode"
                        value={formData.zipCode || ''}
                        onChange={handleInputChange}
                        placeholder="Enter ZIP code"
                        onBlur={() => {
                          if (formData.street || formData.city || formData.state) {
                            setFormData(prev => ({
                              ...prev,
                              deliveryAddress: formatDeliveryAddress()
                            }));
                          }
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={formData.country || 'India'}
                    onChange={handleInputChange}
                    placeholder="Enter country"
                    onBlur={() => {
                      if (formData.street || formData.city || formData.state) {
                        setFormData(prev => ({
                          ...prev,
                          deliveryAddress: formatDeliveryAddress()
                        }));
                      }
                    }}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">Payment Method</h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Check
                  type="radio"
                  id="cash"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={handleInputChange}
                  label="Cash on Delivery"
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="card"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={handleInputChange}
                  label="Credit/Debit Card"
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  id="upi"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={handleInputChange}
                  label="UPI Payment"
                />
              </Form>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h4 className="mb-0">Additional Notes</h4>
            </Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special delivery instructions or notes..."
                />
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Order Summary</h4>
            </Card.Header>
            <Card.Body>
              {cartItems.map((item) => (
                <div key={item.product._id} className="d-flex justify-content-between mb-2">
                  <div>
                    <small>{item.product.title} × {item.quantity}</small>
                    <br />
                    <small className="text-muted">
                      Farmer: {item.product.farmer?.name}
                    </small>
                  </div>
                  <small>₹{(item.product.pricePerUnit * item.quantity).toFixed(2)}</small>
                </div>
              ))}
              
              <hr />
              <div className="d-flex justify-content-between mb-3">
                <strong>Total:</strong>
                <strong>₹{getCartTotal().toFixed(2)}</strong>
              </div>

              <div className="mb-3 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>Delivery to:</strong><br />
                  {formData.deliveryAddress || 'No address provided'}
                </small>
              </div>

              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={handlePlaceOrder}
                disabled={loading || !formData.deliveryAddress || formData.deliveryAddress.length < 10}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>

              <Button
                variant="outline-secondary"
                className="w-100 mt-2"
                onClick={() => navigate('/cart')}
              >
                Back to Cart
              </Button>
            </Card.Body>
          </Card>

          <Card className="mt-3">
            <Card.Body>
              <h6>Delivery Information</h6>
              <small className="text-muted">
                Farmer: {cartItems[0]?.product.farmer?.name || 'Unknown'}
                <br />
                Expected delivery: 2-3 business days
                <br />
                Free delivery on all orders
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;