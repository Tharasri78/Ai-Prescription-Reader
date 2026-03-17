import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/api';
import { useUser } from '../../context/UserContext';
import Navbar from '../../components/Navbar/Navbar';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const validateForm = () => {
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Check password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    // Check terms agreement
    if (!agreeTerms) {
      setError('You must agree to the Terms & Privacy');
      return false;
    }

    return true;
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate form
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setError('');

  try {
    console.log('📤 Attempting registration for:', formData.email);
    
    const response = await authService.register({
      fullName: formData.fullName,  // Backend expects fullName
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });

    console.log('✅ Registration successful:', response);
    
    // Set user in context
    login(response.user);
    
    navigate('/upload');

  } catch (err) {
    console.error('❌ Registration failed:', err);
    
    // Handle error based on your backend response structure
    if (err.errors) {
      // If backend returns array of errors
      const errorMessages = err.errors.map(e => e.msg).join(', ');
      setError(errorMessages);
    } else if (err.message === 'Email already registered') {
      setError('This email is already registered. Please login instead.');
    } else if (err.message === 'Network Error - Cannot connect to server') {
      setError('Cannot connect to server. Make sure backend is running on port 5000');
    } else if (err.message) {
      setError(err.message);
    } else {
      setError('Registration failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="register-container">
      {/* Animated Background */}
      <div className="register-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      {/* Navbar */}
      <Navbar isVisible={isVisible} />

      {/* Register Form */}
      <div className={`register-simple ${isVisible ? 'content-visible' : ''}`}>
        <div className="register-simple-card">
          <h1>Create Account</h1>
          <p className="register-simple-sub">Get started with MediScan</p>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
              {error.includes('already registered') && (
                <div className="error-action">
                  <Link to="/login">Go to Login →</Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="register-simple-form">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
              disabled={loading}
            />

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

            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>

          

            <button 
              type="submit" 
              className={`register-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="register-divider">
            <span>or</span>
          </div>


          <p className="login-link-simple">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;