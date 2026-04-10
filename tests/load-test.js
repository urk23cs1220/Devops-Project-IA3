import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 50 }, // Ramp up to 50 users (trigger HPA)
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must be under 500ms
  },
};

export default function () {
  const url = __ENV.API_URL || 'http://localhost:7000/api/test';
  
  // 1. Hit health endpoint
  let res = http.get(url);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has status message': (r) => r.json().status !== undefined,
  });

  sleep(1);

  // 2. Simulate AI prediction load
  const predictUrl = url.replace('/test', '/utils/predict-price');
  const payload = JSON.stringify({
    crop: 'Tomato',
    region: 'Vellore'
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      // No auth in this test for simplicity, or provide a test token via __ENV
    },
  };

  let predictRes = http.post(predictUrl, payload, params);
  // Note: This might return 401 if auth is strictly enforced during load test
  check(predictRes, {
    'predict res is not 500': (r) => r.status !== 500,
  });

  sleep(1);
}
