import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useUser } from '../../context/UserContext';
import Navbar from '../../components/Navbar/Navbar';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsVisible(true);
    
    // If already logged in, redirect to upload
    if (authService.isAuthenticated()) {
      navigate('/upload');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.email || !formData.password) {
    setError('Please enter both email and password');
    return;
  }

  setLoading(true);
  setError('');

  try {
    console.log('📤 Attempting login with:', formData.email);
    
    const response = await authService.login({
      email: formData.email,
      password: formData.password
    });

    console.log('✅ Login successful:', response);
    
    // Set user in context
    login(response.user);
    
    navigate('/upload');

  } catch (err) {
    console.error('❌ Login failed:', err);
    
    // Handle error based on your backend response structure
    if (err.message === 'Invalid credentials') {
      setError('Invalid email or password');
    } else if (err.message === 'Network Error - Cannot connect to server') {
      setError('Cannot connect to server. Make sure backend is running on port 5000');
    } else if (err.message) {
      setError(err.message);
    } else {
      setError('Login failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="login-container">
      {/* Animated Background */}
      <div className="login-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      {/* Navbar */}
      <Navbar isVisible={isVisible} />

      {/* Login Form */}
      <div className={`login-simple ${isVisible ? 'content-visible' : ''}`}>
        <div className="login-simple-card">
          <h1>Welcome Back</h1>
          <p className="login-simple-sub">Sign in to your account</p>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-simple-form">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

            <button 
              type="submit" 
              className={`login-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          
          <p className="register-link-simple">
            Don't have an account? <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;