import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Centralized Request Interceptor adding the Authorization Header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusshare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Token Expiry & Error Formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (response && response.status === 401) {
      // If unauthorized and we're not on the login/register page, clear token
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        localStorage.removeItem('campusshare_token');
        localStorage.removeItem('campusshare_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: (data) => apiClient.post('/api/auth/login', data),
  register: (data) => apiClient.post('/api/auth/register', data),
  getMe: () => apiClient.get('/api/auth/me'),
};

// Item Endpoints
export const itemsApi = {
  search: (params) => apiClient.get('/api/items', { params }),
  getById: (id) => apiClient.get(`/api/items/${id}`),
  getMine: (params) => apiClient.get('/api/items/mine', { params }),
  create: (data) => apiClient.post('/api/items', data),
  update: (id, data) => apiClient.put(`/api/items/${id}`, data),
  delete: (id) => apiClient.delete(`/api/items/${id}`),
  getCategories: () => apiClient.get('/api/categories'),
};

// Rental Endpoints
export const rentalsApi = {
  create: (data) => apiClient.post('/api/rentals', data),
  getMine: (params) => apiClient.get('/api/rentals/mine', { params }),
  getIncoming: (params) => apiClient.get('/api/rentals/incoming', { params }),
  getById: (id) => apiClient.get(`/api/rentals/${id}`),
  approve: (id) => apiClient.patch(`/api/rentals/${id}/approve`),
  reject: (id, data) => apiClient.patch(`/api/rentals/${id}/reject`, data),
  markReturned: (id) => apiClient.patch(`/api/rentals/${id}/return`),
  cancel: (id) => apiClient.patch(`/api/rentals/${id}/cancel`),
};

// Payment Endpoints
export const paymentsApi = {
  markPaid: (rentalId) => apiClient.patch(`/api/rentals/${rentalId}/payment/paid`),
};

// Review Endpoints
export const reviewsApi = {
  create: (rentalId, data) => apiClient.post(`/api/rentals/${rentalId}/review`, data),
  getByItem: (itemId) => apiClient.get(`/api/items/${itemId}/reviews`),
};

// Chatbot Endpoint
export const chatApi = {
  sendMessage: (data) => apiClient.post('/api/chat', data),
};

// Admin Endpoints
export const adminApi = {
  getStats: () => apiClient.get('/api/admin/stats'),
  getUsers: (params) => apiClient.get('/api/admin/users', { params }),
  toggleUserStatus: (id, enabled) => apiClient.patch(`/api/admin/users/${id}/disable`, { enabled }),
  getRentals: (params) => apiClient.get('/api/admin/rentals', { params }),
  getPayments: (params) => apiClient.get('/api/admin/payments', { params }),
  getHealth: () => apiClient.get('/actuator/health'),
};
