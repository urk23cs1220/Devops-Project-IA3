import React, { useState } from 'react';

const OrderTracker = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock order data - replace with actual API call
  const mockOrderData = {
    orderNumber: 'ORD-2024-001',
    trackingNumber: 'TRK123456',
    status: 'delivered',
    carrier: 'UPS',
    estimatedDelivery: 'January 12, 2024',
    orderDate: 'January 10, 2024',
    shippingAddress: {
      name: 'John Doe',
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    trackingHistory: [
      {
        timestamp: '2024-01-10T13:30:00Z',
        description: 'Order confirmed',
        location: 'Farm Warehouse',
        status: 'completed',
        active: false
      },
      {
        timestamp: '2024-01-11T16:00:00Z',
        description: 'Shipped',
        location: 'Distribution Center',
        status: 'completed',
        active: false
      },
      {
        timestamp: '2024-01-12T19:45:00Z',
        description: 'Out for delivery',
        location: 'Local Facility',
        status: 'completed',
        active: false
      },
      {
        timestamp: '2024-01-12T22:15:00Z',
        description: 'Delivered',
        location: 'Your Address',
        status: 'completed',
        active: true
      }
    ]
  };

  const trackOrder = async (e) => {
    if (e) e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock validation - in real app, this would be an API call
      if (trackingNumber.toUpperCase() === 'TRK123456') {
        setOrderData(mockOrderData);
      } else {
        setError('Order not found. Please check your tracking number.');
      }
    } catch (err) {
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'shipped': 'status-shipped',
      'out-for-delivery': 'status-out-for-delivery',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusColors[status] || '';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="order-tracker-container fade-in-up">
      <div className="order-tracker-header">
        <h1>Track Your Order</h1>
        <p className="lead">Enter your tracking number to see the current status and delivery timeline</p>
      </div>

      <form onSubmit={trackOrder} className="track-search-form">
        <div className="search-input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter tracking number (e.g., TRK123456)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </div>
        <p className="help-text">
          Can't find your tracking number? <a href="/contact">Contact Support</a>
        </p>
      </form>

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Searching for your order...</p>
        </div>
      )}

      {error && (
        <div className="error-state fade-in">
          <div className="error-icon">❌</div>
          <h3>Order Not Found</h3>
          <p>{error}</p>
          <button 
            className="btn btn-success mt-3"
            onClick={() => setError('')}
          >
            Try Again
          </button>
        </div>
      )}

      {orderData && !loading && (
        <div className="order-details-card fade-in">
          {/* Order Header */}
          <div className="order-header">
            <div className="order-meta">
              <h3>Order #{orderData.orderNumber}</h3>
              <p className="order-date">Placed on {orderData.orderDate}</p>
            </div>
            <div className={`order-status-badge ${getStatusColor(orderData.status)}`}>
              {orderData.status.replace('-', ' ').toUpperCase()}
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="tracking-timeline-section">
            <div className="timeline-header">
              <h4>Delivery Progress</h4>
              <div className="estimated-delivery">
                Delivered on: {orderData.estimatedDelivery}
              </div>
            </div>
            
            <div className="timeline">
              {orderData.trackingHistory.map((event, index) => (
                <div 
                  key={index}
                  className={`timeline-event ${event.active ? 'active' : 'completed'} slide-in-right`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="timeline-marker"></div>
                  <div className="event-content">
                    <h5>{event.description}</h5>
                    <p className="event-description">{event.location}</p>
                    <div className="event-meta">
                      <span className="event-date">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Information */}
          <div className="order-info-grid">
            <div className="info-card">
              <h5>Order Information</h5>
              <div className="info-details">
                <p>
                  <strong>Order Number:</strong>
                  <span>{orderData.orderNumber}</span>
                </p>
                <p>
                  <strong>Tracking Number:</strong>
                  <span>{orderData.trackingNumber}</span>
                </p>
                <p>
                  <strong>Carrier:</strong>
                  <span>{orderData.carrier}</span>
                </p>
                <p>
                  <strong>Status:</strong>
                  <span className={getStatusColor(orderData.status)}>
                    {orderData.status.replace('-', ' ').toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            <div className="info-card shipping-info">
              <h5>Shipping Information</h5>
              <div className="info-details">
                <p>
                  <strong>Name:</strong>
                  <span>{orderData.shippingAddress.name}</span>
                </p>
                <p>
                  <strong>Address:</strong>
                  <span>{orderData.shippingAddress.street}</span>
                </p>
                <p>
                  <strong>City:</strong>
                  <span>{orderData.shippingAddress.city}</span>
                </p>
                <p>
                  <strong>State/ZIP:</strong>
                  <span>{orderData.shippingAddress.state} {orderData.shippingAddress.zipCode}</span>
                </p>
                <p>
                  <strong>Country:</strong>
                  <span>{orderData.shippingAddress.country}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="order-actions">
            <button className="btn btn-success">
              📧 Email Receipt
            </button>
            <button className="btn btn-outline-success">
              🖨️ Print Details
            </button>
            <button className="btn btn-outline-success">
              🔄 Reorder Items
            </button>
            <button className="btn btn-outline-success">
              ❓ Get Help
            </button>
          </div>
        </div>
      )}

      {!orderData && !loading && !error && (
        <div className="empty-state fade-in">
          <div className="empty-icon">📦</div>
          <h3>Ready to Track Your Order</h3>
          <p>Enter your tracking number above to see the current status, delivery timeline, and order details.</p>
          <div className="mt-4">
            <small className="text-muted">
              Try using: <strong>TRK123456</strong>
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracker;