import axios from 'axios';

// Set API_URL based on environment. In production (K8s), we use relative paths via Nginx proxy.
const API_URL = import.meta.env.VITE_API_URL || '';

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
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Special handling for orders endpoint to debug response format
    if (response.config.url.includes('/api/orders/farmer')) {
      console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - Response Type:`, typeof response.data);
      console.log(`📦 [ORDERS] Raw response data:`, response.data);
      console.log(`📦 [ORDERS] Is Array?`, Array.isArray(response.data));
      if (response.data && typeof response.data === 'object') {
        console.log(`📦 [ORDERS] Object keys:`, Object.keys(response.data));
        Object.keys(response.data).forEach(key => {
          console.log(`📦 [ORDERS] Key "${key}" type:`, typeof response.data[key], 'isArray:', Array.isArray(response.data[key]));
        });
      }
    } else {
      console.log(`✅ [API] ${response.config.method?.toUpperCase()} ${response.config.url} - Success:`, response.data);
    }
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