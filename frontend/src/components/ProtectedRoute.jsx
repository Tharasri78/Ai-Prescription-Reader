import { Navigate } from "react-router-dom";
import { authService } from "../services/api";
import { useState, useEffect } from "react";

const ProtectedRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated();
      setIsAuth(authenticated);
    };
    
    checkAuth();
  }, []);

  // Still checking
  if (isAuth === null) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0f1e 0%, #1a1f30 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid rgba(102, 126, 234, 0.3)',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated
  return children;
};

export default ProtectedRoute;