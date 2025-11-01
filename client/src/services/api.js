import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type if not multipart/form-data
    if (!config.headers['Content-Type'] && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    // Log outgoing requests for debugging
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - Success:`, response.data);
    return response;
  },
  (error) => {
    // Enhanced error logging for orders endpoint
    if (error.config?.url?.includes('/api/orders')) {
      console.error('🛒 ORDER API ERROR DETAILS:', {
        url: error.config.url,
        method: error.config.method,
        status: error.response?.status,
        serverMessage: error.response?.data,
        requestPayload: error.config.data,
        validationErrors: error.response?.data?.errors
      });
    }
    
    console.error('❌ [API] Error:', {
      endpoint: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      console.log('🔐 [AUTH] Token expired or invalid - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;