import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// CSRF Token management
let csrfToken: string | null = null;

// Fetch CSRF token on app load
export const fetchCsrfToken = async () => {
  try {
    const response = await axios.get('/api/csrf-token', { withCredentials: true });
    csrfToken = response.data.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
};

// Add CSRF token to all state-changing requests
api.interceptors.request.use((config) => {
  // Add CSRF token to POST, PUT, DELETE, PATCH requests
  if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

// Retry with fresh CSRF token if we get a 403 (invalid token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we get 403 and haven't retried yet, fetch new token and retry
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      await fetchCsrfToken();
      
      // Add new token to the original request
      if (csrfToken && originalRequest.method && ['post', 'put', 'delete', 'patch'].includes(originalRequest.method.toLowerCase())) {
        originalRequest.headers['x-csrf-token'] = csrfToken;
      }
      
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);
