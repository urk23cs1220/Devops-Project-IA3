const request = require('supertest');
const app = require('../server');

describe('API Health and Utilities', () => {
  test('GET /api/test should return server status', async () => {
    const response = await request(app).get('/api/test');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'Server is running successfully');
  });

  test('POST /api/utils/predict-price should return prediction', async () => {
    const response = await request(app)
      .post('/api/utils/predict-price')
      .send({ crop: 'Tomato', region: 'Vellore' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('crop', 'Tomato');
    expect(response.body).toHaveProperty('predictedPrice');
    expect(Array.isArray(response.body.insights)).toBe(true);
  });

  test('POST /api/utils/predict-price should fail without crop name', async () => {
    const response = await request(app)
      .post('/api/utils/predict-price')
      .send({ region: 'Vellore' });
    
    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty('message', 'Crop name is required');
  });
});
