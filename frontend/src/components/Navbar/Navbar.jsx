import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import './Navbar.css';

const Navbar = ({ isVisible = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const displayName = user?.fullName?.split(' ')[0] || user?.fullName || 'User';
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    if (isHomePage) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      <nav className={`navbar ${isVisible ? 'visible' : ''}`}>
        <div className="nav-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">💊</span>
          <span className="brand-name">Medi<span className="brand-highlight">Scan</span></span>
        </div>

        {/* Desktop links */}
        <div className="nav-links desktop">
          {isHomePage ? (
            <>
              <button onClick={() => scrollToSection('home')}>Home</button>
              <button onClick={() => scrollToSection('features')}>Features</button>
              <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button onClick={() => scrollToSection('about')}>About</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/')}>Home</button>
              {user && (
                <>
                  <button onClick={() => navigate('/upload')}>Upload</button>
                  <button onClick={() => navigate('/history')}>History</button>
                </>
              )}
            </>
          )}
        </div>

        {/* Desktop actions - hide on auth pages */}
        {!isAuthPage && (
          <div className="nav-actions desktop">
            {user ? (
              <>
                <div className="user-profile">
                  <span className="user-avatar">{displayName.charAt(0).toUpperCase()}</span>
                  <span className="user-name">{displayName}</span>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
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
        )}

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <span className={`bar ${isMobileMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMobileMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMobileMenuOpen ? 'active' : ''}`}></span>
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-header">
          <div className="nav-brand">
            <span className="brand-icon">💊</span>
            <span className="brand-name">Medi<span className="brand-highlight">Scan</span></span>
          </div>
          <button className="close-btn" onClick={toggleMobileMenu}>✕</button>
        </div>

        <div className="mobile-links">
          {isHomePage ? (
            <>
              <button onClick={() => scrollToSection('home')}>Home</button>
              <button onClick={() => scrollToSection('features')}>Features</button>
              <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button onClick={() => scrollToSection('about')}>About</button>
            </>
          ) : (
            <>
              <button onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>Home</button>
              {user && (
                <>
                  <button onClick={() => { navigate('/upload'); setIsMobileMenuOpen(false); }}>Upload</button>
                  <button onClick={() => { navigate('/history'); setIsMobileMenuOpen(false); }}>History</button>
                </>
              )}
            </>
          )}
        </div>

        <div className="mobile-auth-section">
          {user ? (
            <div className="mobile-user">
              <div className="mobile-avatar">{displayName.charAt(0).toUpperCase()}</div>
              <span className="mobile-username">{displayName}</span>
              <button className="mobile-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : !isAuthPage && (
            <div className="mobile-auth-buttons">
              <button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>
                Sign In
              </button>
              <button className="primary" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;