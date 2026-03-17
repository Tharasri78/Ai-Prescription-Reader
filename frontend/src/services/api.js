import axios from 'axios';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🌐 Connecting to backend at:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀 Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status);
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request timeout');
      return Promise.reject({ message: 'Server timeout. Please try again.' });
    }
    
    if (!error.response) {
      console.error('❌ Network Error - Cannot reach server');
      return Promise.reject({ message: 'Cannot connect to server. Make sure backend is running on port 5000' });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export const authService = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword
      });
      
      console.log('📥 Register response:', response.data);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('❌ Register error:', error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      
      console.log('📥 Login response:', response.data);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data;
      }
      return response.data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('❌ Error parsing user:', e);
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }
};

export default api;