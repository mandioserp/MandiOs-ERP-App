import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Request interceptor to add bearer token
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('mandi_token');
      if (token && token !== 'null' && token !== 'undefined' && token.trim() !== '') {
        config.headers.Authorization = `Bearer ${token.trim()}`;
      }
    } catch {
      // Ignore storage access errors
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to clean expired tokens only on genuine authentication failure
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const errMsg = error.response.data?.error || '';
      // Only clear storage if token itself is verified expired/invalid or profile check fails
      if (
        url.includes('/auth/profile') ||
        errMsg.includes('Token is invalid or expired') ||
        errMsg.includes('Authorization token is missing or invalid')
      ) {
        if (!url.includes('/auth/login')) {
          try {
            localStorage.removeItem('mandi_token');
            localStorage.removeItem('mandi_login_time');
          } catch {}
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

