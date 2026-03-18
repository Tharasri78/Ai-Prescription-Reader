import axios from 'axios';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Debug (only in development)
if (import.meta.env.DEV) {
  console.log('🌐 Connecting to backend at:', API_URL);
}

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // ✅ increased for AI calls
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
// ❌ RESPONSE INTERCEPTOR
// -------------------------------
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('✅ Response:', response.status);
    }
    return response;
  },
  (error) => {
    // Timeout
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout');
      return Promise.reject({
        message: 'Server timeout. AI processing may be slow. Try again.',
      });
    }

    // Network error
    if (!error.response) {
      console.error('❌ Network Error');
      return Promise.reject({
        message: 'Cannot connect to backend. Make sure server is running.',
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
  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
      });

      if (import.meta.env.DEV) {
        console.log('📥 Register response:', response.data);
      }

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  },

  // Login
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      if (import.meta.env.DEV) {
        console.log('📥 Login response:', response.data);
      }

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Auth check
  isAuthenticated: () => {
    return !!(localStorage.getItem('token') && localStorage.getItem('user'));
  },
};

// -------------------------------
// 🤖 SCAN SERVICE (NEW)
// -------------------------------
export const scanService = {
  scanPrescription: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(
        '/scan/prescription',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 20000, // AI can take time
        }
      );

      if (import.meta.env.DEV) {
        console.log('📥 Scan response:', response.data);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Scan error:', error);
      throw error;
    }
  },
};

// Export axios instance
export default api;