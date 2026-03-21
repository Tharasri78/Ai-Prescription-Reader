import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Navbar.css';

const Navbar = ({ isVisible }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user's first name or full name
  const displayName = user?.fullName?.split(' ')[0] || user?.fullName || 'User';

  // Check if we're on home page
  const isHomePage = location.pathname === '/';

  // Smooth scroll function for home page sections
  const scrollToSection = (sectionId) => {
    if (isHomePage) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // If not on home page, navigate to home page first then scroll
      navigate('/');
      // Small delay to allow page to load before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <nav className={`navbar ${isVisible ? 'nav-visible' : ''}`}>
      <div className="nav-brand" onClick={() => navigate('/')}>
        <span className="brand-icon">💊</span>
        <span className="brand-name">Medi<span className="brand-highlight">Scan</span></span>
      </div>
      
      <div className="nav-links">
        {isHomePage ? (
          // On Home page - show section navigation
          <>
            <button className="nav-link" onClick={() => scrollToSection('home')}>
              Home
            </button>
            <button className="nav-link" onClick={() => scrollToSection('features')}>
              Features
            </button>
            <button className="nav-link" onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </button>
            <button className="nav-link" onClick={() => scrollToSection('about')}>
              About
            </button>
          </>
        ) : (
          // On other pages - show page navigation
          <>
            <button className="nav-link" onClick={() => navigate('/')}>
              Home
            </button>
            {user && (
  <>
    <button className="nav-link" onClick={() => navigate('/upload')}>
      Upload
    </button>

    <button className="nav-link" onClick={() => navigate('/history')}>
      History
    </button>
  </>
)}
          </>
        )}
      </div>
      
      <div className="nav-actions">
        {user ? (
          // Show when logged in
          <>
            <div className="user-profile">
              <span className="user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="user-name">{displayName}</span>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          // Show when not logged in
          <>
            <button className="btn-outline" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;