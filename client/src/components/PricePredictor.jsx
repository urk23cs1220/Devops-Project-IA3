import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner, ProgressBar, Badge } from 'react-bootstrap';
import api from '../services/api';

const PricePredictor = () => {
  const [crop, setCrop] = useState('');
  const [region, setRegion] = useState('Central India');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  const crops = [
    'Tomato', 'Onion', 'Potato', 'Mango', 'Rice', 'Wheat', 'Spinach', 'Apple'
  ];

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!crop) return;

    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const response = await api.post('/api/utils/predict-price', { crop, region });
      
      // Simulate "AI thinking" delay for better UX
      setTimeout(() => {
        setPrediction(response.data);
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to get prediction. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-0 overflow-hidden" style={{ borderRadius: '15px' }}>
      <div className="p-4" style={{ background: 'linear-gradient(135deg, #1e5631 0%, #2d8a4e 100%)', color: 'white' }}>
        <h4 className="mb-1">🤖 AI Crop Price Predictor</h4>
        <p className="mb-0 opacity-75">Get smart market insights for your harvest</p>
      </div>
      
      <Card.Body className="p-4">
        <Form onSubmit={handlePredict}>
          <Row className="align-items-end">
            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Select Crop</Form.Label>
                <Form.Select 
                  value={crop} 
                  onChange={(e) => setCrop(e.target.value)}
                  className="form-control-lg"
                  required
                >
                  <option value="">Choose a crop...</option>
                  {crops.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">Region</Form.Label>
                <Form.Control 
                  type="text" 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Enter region"
                  className="form-control-lg"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Button 
                variant="success" 
                type="submit" 
                size="lg" 
                className="w-100 mb-3 py-2 fw-bold"
                disabled={loading}
                style={{ borderRadius: '10px' }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Predict Price'}
              </Button>
            </Col>
          </Row>
        </Form>

        {loading && (
          <div className="text-center py-5">
            <div className="mb-3">
              <Spinner animation="grow" variant="success" className="me-2" />
              <Spinner animation="grow" variant="success" className="me-2" style={{ animationDelay: '0.2s' }} />
              <Spinner animation="grow" variant="success" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-muted fw-bold">Analyzing market data & weather patterns...</p>
          </div>
        )}

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

        {prediction && (
          <div className="mt-4 animate-fadeIn">
            <hr className="my-4" />
            
            <Row>
              <Col md={6}>
                <div className="p-4 bg-light rounded-4 text-center border">
                  <h6 className="text-uppercase text-muted small fw-bold mb-2">Predicted Market Price</h6>
                  <div className="display-4 fw-bold text-success mb-2">
                    ₹{prediction.predictedPrice}
                    <span className="fs-4 text-muted">/{prediction.unit}</span>
                  </div>
                  <Badge bg="success" className="px-3 py-2" pill>
                    Confidence: {prediction.confidence}%
                  </Badge>
                  <div className="mt-3 text-muted small">
                    Estimated Range: <strong>₹{prediction.minPrice} - ₹{prediction.maxPrice}</strong>
                  </div>
                </div>
              </Col>
              
              <Col md={6}>
                <h6 className="fw-bold mt-3 mt-md-0 mb-3">AI Insights:</h6>
                <ul className="list-unstyled">
                  {prediction.insights.map((insight, i) => (
                    <li key={i} className="mb-3 d-flex align-items-start">
                      <span className="me-2 fs-5">💡</span>
                      <span className="text-dark">{insight}</span>
                    </li>
                  ))}
                </ul>
                
                <h6 className="fw-bold mt-4 mb-2">3-Month Forecast:</h6>
                <div className="d-flex gap-2">
                  {prediction.forecast.map((f, i) => (
                    <div key={i} className="flex-fill text-center p-2 rounded bg-white border">
                      <div className="small fw-bold">{f.month}</div>
                      <div className={f.trend === 'rising' ? 'text-success' : 'text-danger'}>
                        {f.trend === 'rising' ? '▲' : '▼'} {f.trend}
                      </div>
                    </div>
                  ))}
                </div>
              </Col>
            </Row>

            <Alert variant="info" className="mt-4 border-0 bg-opacity-10" style={{ backgroundColor: '#e9f7ef' }}>
              <div className="d-flex align-items-center">
                <span className="fs-4 me-3">📊</span>
                <div>
                  <strong>Pro Tip:</strong> Based on the {prediction.forecast[0].trend} trend, you might want to {prediction.forecast[0].trend === 'rising' ? 'wait a week' : 'list your produce soon'} for maximum profit.
                </div>
              </div>
            </Alert>
          </div>
        )}
      </Card.Body>
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rounded-4 { border-radius: 1rem !important; }
      `}</style>
    </Card>
  );
};

export default PricePredictor;
