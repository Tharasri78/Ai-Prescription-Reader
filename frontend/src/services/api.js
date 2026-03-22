import axios from 'axios';

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

if (import.meta.env.DEV) {
  console.log('🌐 Connecting to backend at:', API_URL);
}

// AXIOS INSTANCE
const api = axios.create({
  baseURL: API_URL,
  timeout: 120000, 
});

// -------------------------------
// 🔐 REQUEST INTERCEPTOR
// -------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (import.meta.env.DEV) {
      console.log('🚀 Request:', config.method.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------------
// ❌ RESPONSE INTERCEPTOR (FIXED)
// -------------------------------
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ Response:', response.status);
    }
    return response;
  },
  (error) => {

    // ❌ REMOVE ALERTS COMPLETELY
    console.error('❌ API Error:', error);

    // Network error
    if (!error.response) {
      return Promise.reject({
        message: 'Cannot connect to backend. Server may be slow or down.',
      });
    }

    // Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error.response?.data || error);
  }
);

// -------------------------------
// 🔐 AUTH SERVICE
// -------------------------------
export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);

    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);

    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// -------------------------------
// 🤖 SCAN SERVICE (FIXED)
// -------------------------------
export const scanService = {
  getScanById: async (id) => {
  const response = await api.get(`/scan/${id}`);
  return response.data;
},
  getHistory: async () => {
  const response = await api.get('/scan/history');
  return response.data;
},
deleteScan: async (id) => {
  const response = await api.delete(`/scan/${id}`);
  return response.data;
},
  scanPrescription: async (file) => {

  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    '/scan/prescription',
    formData,
    {
      timeout: 120000,
    }
  );

  return response.data;
},
};

export default api;