import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
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

  const features = [
  {
    title: "Upload Prescription",
    description: "Upload handwritten prescriptions and instantly convert them into structured digital data."
  },
  {
    title: "AI Medicine Extraction",
    description: "Automatically detects medicine names, dosage, frequency, and duration using AI."
  },
  {
    title: "Accurate Data Processing",
    description: "Cleans and validates extracted medicine names for better accuracy and readability."
  },
  {
    title: "Scan History",
    description: "View previously scanned prescriptions and access extracted medicine details anytime."
  }
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

      {/* Navbar */}
      <Navbar isVisible={isVisible} />

      {/* Hero Section - with id="home" */}
      <section id="home" ref={homeRef} className={`hero-section ${isVisible ? 'hero-visible' : ''}`}>
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
            
          </p>

          <div className="hero-actions">
            <button className="btn-primary btn-large" onClick={() => navigate('/upload')}>
              Start Scanning
              <span className="btn-arrow">→</span>
            </button>
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

      {/* Features Section - with id="features" */}
      <section id="features" ref={featuresRef} className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            Why Choose <span className="title-gradient">MediScan</span>
          </h2>
          <p className="section-subtitle">
            Experience the future of prescription reading with our AI technology
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-hover-effect"></div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section - with id="how-it-works" */}
      <section id="how-it-works" ref={howItWorksRef} className="how-it-works">
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
              <p>Simply upload a photo of your handwritten prescription</p>
            </div>
            <div className="step-connector"></div>
          </div>

          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI Analysis</h3>
              <p>Our AI reads and converts complex handwritten notes into structured data</p>
            </div>
            <div className="step-connector"></div>
          </div>

          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Clear Results</h3>
              <p>Our AI reads and converts complex handwritten notes into structured data</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - with id="about" */}
      <section id="about" ref={aboutRef} className="about-section">
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
              MediScan was built to solve a real problem — handwritten prescriptions are often hard to read, leading to confusion and medication mistakes.

            </p>
            <p>
              Using AI, MediScan instantly converts complex prescriptions into clear, structured information, helping users understand their medicines quickly and safely.

            </p>
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
              <button className="footer-link" onClick={() => {
                document.getElementById('')?.scrollIntoView({ behavior: 'smooth' });
              }}>Features</button>
              <button className="footer-link" onClick={() => {
                document.getElementById('')?.scrollIntoView({ behavior: 'smooth' });
              }}>How It Works</button>
              <button className="footer-link" onClick={() => navigate('')}>FAQ</button>
            </div>
            
            <div className="footer-column">
              <h4>Company</h4>
              <button className="footer-link" onClick={() => {
                document.getElementById('')?.scrollIntoView({ behavior: 'smooth' });
              }}>About</button>
              <button className="footer-link" onClick={() => navigate('')}>Careers</button>
              <button className="footer-link" onClick={() => navigate('')}>Contact</button>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <button className="footer-link" onClick={() => navigate('')}>Privacy</button>
              <button className="footer-link" onClick={() => navigate('')}>Terms</button>
              <button className="footer-link" onClick={() => navigate('')}>Security</button>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 MediScan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;