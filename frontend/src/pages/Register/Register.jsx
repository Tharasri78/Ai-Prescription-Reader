import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/upload');
  };

  return (
    <div className="register-container">
      {/* Animated Background */}
      <div className="register-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      {/* Simple Navigation */}
      <nav className={`register-nav ${isVisible ? 'nav-visible' : ''}`}>
        <div className="nav-brand" onClick={() => navigate('/')}>
          <span className="brand-name">MediScan</span>
        </div>
        <div className="nav-actions">
          <button className="btn-outline" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Register</button>
        </div>
      </nav>

      {/* Simple Register Form */}
      <div className={`register-simple ${isVisible ? 'content-visible' : ''}`}>
        <div className="register-simple-card">
          <h1>Create Account</h1>
          <p className="register-simple-sub">Get started with MediScan</p>

          <form onSubmit={handleSubmit} className="register-simple-form">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <div className="terms-checkbox">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <label htmlFor="terms">I agree to Terms & Privacy</label>
            </div>

            <button type="submit" className="register-submit-btn">
              Create Account
            </button>
          </form>

          
          
          <div className="login-divider">
            <span>or</span>
          </div>


          <p className="login-link-simple">
            Have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;