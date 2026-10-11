import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Intercept requests to attach JWT Token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartpg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercept responses for auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear and notify
      localStorage.removeItem('smartpg_token');
      localStorage.removeItem('smartpg_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
