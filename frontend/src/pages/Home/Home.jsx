import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Create refs for each section
  const homeRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const aboutRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Smooth scroll function
  const scrollToSection = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const features = [
    {
      
      title: "Smart Capture",
      description: "Upload or capture prescription images with instant preview"
    },
    {
     
      title: "AI Enhancement",
      description: "Advanced image processing for maximum OCR accuracy"
    },
    {
     
      title: "Medicine Cards",
      description: "Structured, easy-to-read medicine information"
    },
    {
     
      title: "AI Explanations",
      description: "Simple, clear explanations for every medicine"
    }
  ];

  const stats = [
  { number: "99%", label: "Accuracy Rate" },
  { number: "100+", label: "Users" },        // Changed from 50k+ Prescriptions
  { number: "5+", label: "Medicines" },       // Changed from 10+ Languages
  { number: "24/7", label: "Availability" }
  ];

  return (
    <div className="home-container">
      {/* Animated Background */}
      <div className="gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      {/* Mouse Follower Effect */}
      <div 
        className="mouse-follower"
        style={{ 
          transform: `translate(${mousePosition.x - 150}px, ${mousePosition.y - 150}px)`
        }}
      ></div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element pulse">💊</div>
        <div className="floating-element float">🔬</div>
        <div className="floating-element spin">⚕️</div>
        <div className="floating-element bounce">📋</div>
      </div>

      {/* Navigation - FIXED with scroll functionality */}
      <nav className={`navbar ${isVisible ? 'nav-visible' : ''}`}>
        <div className="nav-brand" onClick={() => scrollToSection(homeRef)} style={{cursor: 'pointer'}}>
          <span className="brand-icon">💊</span>
          <span className="brand-name">Medi<span className="brand-highlight">Scan</span></span>
        </div>
        <div className="nav-links">
          <button 
            className="nav-link" 
            onClick={() => scrollToSection(homeRef)}
          >
            Home
          </button>
          <button 
            className="nav-link" 
            onClick={() => scrollToSection(featuresRef)}
          >
            Features
          </button>
          <button 
            className="nav-link" 
            onClick={() => scrollToSection(howItWorksRef)}
          >
            How It Works
          </button>
          <button 
            className="nav-link" 
            onClick={() => scrollToSection(aboutRef)}
          >
            About
          </button>
        </div>
        <div className="nav-actions">
            
          <button className="btn-outline" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
        
        
      </nav>

      {/* Hero Section - with ref for Home */}
      <section ref={homeRef} className={`hero-section ${isVisible ? 'hero-visible' : ''}`}>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            AI-Powered Prescription Reader
          </div>
          
          <h1 className="hero-title">
            Decode Any Prescription
            <span className="title-gradient"> Instantly</span>
          </h1>
          
          <p className="hero-subtitle">
            Transform handwritten prescriptions into clear, digital medicine information.
            Smart OCR meets AI for perfect readability every time.
          </p>

          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={() => navigate('/upload')}>
              Start Scanning
              <span className="btn-arrow">→</span>
            </button>
           
          </div>

          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-card">
            <div className="visual-header">
              <div className="visual-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="visual-title">Prescription Preview</span>
            </div>
            
            <div className="prescription-preview">
              <div className="preview-line"></div>
              <div className="preview-line short"></div>
              <div className="preview-line"></div>
              <div className="preview-line half"></div>
              <div className="medicine-highlight">
                <div className="medicine-name">Paracetamol</div>
                <div className="medicine-dosage">500mg - Twice daily</div>
              </div>
            </div>

            <div className="visual-footer">
              <div className="ai-badge">
                <span className="ai-icon">✨</span>
                AI Processing Active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - with ref */}
      <section ref={featuresRef} className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            Why Choose <span className="title-gradient">MediScan</span>
          </h2>
          <p className="section-subtitle">
            Experience the future of prescription reading with our advanced AI technology
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-hover-effect"></div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section - with ref */}
      <section ref={howItWorksRef} className="how-it-works">
        <div className="section-header">
          <h2 className="section-title">
            Simple <span className="title-gradient">3-Step</span> Process
          </h2>
          <p className="section-subtitle">
            Get your prescription digitized in minutes
          </p>
        </div>

        <div className="steps-container">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Upload Prescription</h3>
              <p>Take a photo or upload your prescription image</p>
            </div>
            <div className="step-connector"></div>
          </div>

          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Processing</h3>
              <p>Our AI extracts and structures medicine information</p>
            </div>
            <div className="step-connector"></div>
          </div>

          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Results</h3>
              <p>View clear medicine cards with AI explanations</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - with ref */}
      <section ref={aboutRef} className="about-section">
        <div className="section-header">
          <h2 className="section-title">
            About <span className="title-gradient">MediScan</span>
          </h2>
          <p className="section-subtitle">
            Making healthcare more accessible through technology
          </p>
        </div>
        
        <div className="about-content">
          <div className="about-text">
            <p>
              MediScan was born from a simple observation: millions of patients struggle to read 
              handwritten prescriptions, leading to medication errors and confusion.
            </p>
            <p>
              Our mission is to bridge this gap using cutting-edge AI and OCR technology, 
              making prescription information clear and accessible to everyone, regardless of 
              language or location.
            </p>
            <div className="about-stats">
              
              
              
            </div>
          </div>
          <div className="about-image">
            <div className="about-card">
              <span className="about-quote">"</span>
              <p>Making prescriptions readable for everyone</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">
            Ready to Transform Your Prescription Experience?
          </h2>
          <p className="cta-subtitle">
            Join thousands of users who trust MediScan for accurate prescription reading
          </p>
          <button className="btn-primary btn-large" onClick={() => navigate('/register')}>
            Get Started Now
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-icon">💊</span>
            <span className="brand-name">MediScan</span>
            <p className="footer-description">
              Making prescriptions readable for everyone
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <button className="footer-link" onClick={() => scrollToSection(featuresRef)}>Features</button>
              <button className="footer-link" onClick={() => scrollToSection(howItWorksRef)}>How It Works</button>
              <button className="footer-link" onClick={() => navigate('/pricing')}>Pricing</button>
              <button className="footer-link" onClick={() => navigate('/faq')}>FAQ</button>
            </div>
            
            <div className="footer-column">
              <h4>Company</h4>
              <button className="footer-link" onClick={() => scrollToSection(aboutRef)}>About</button>
              <button className="footer-link" onClick={() => navigate('/blog')}>Blog</button>
              <button className="footer-link" onClick={() => navigate('/careers')}>Careers</button>
              <button className="footer-link" onClick={() => navigate('/contact')}>Contact</button>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <button className="footer-link" onClick={() => navigate('/privacy')}>Privacy</button>
              <button className="footer-link" onClick={() => navigate('/terms')}>Terms</button>
              <button className="footer-link" onClick={() => navigate('/security')}>Security</button>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 MediScan. All rights reserved.</p>
          
        </div>
      </footer>
    </div>
  );
};

export default Home;