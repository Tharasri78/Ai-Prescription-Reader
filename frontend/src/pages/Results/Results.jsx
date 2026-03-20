import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import MedicineCard from '../../components/MedicineCard/MedicineCard';
import './Results.css';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const medicines = location.state?.medicines || [];

  // 🚨 prevent empty access
  if (!location.state) {
    navigate('/upload');
    return null;
  }

  const handleNewScan = () => {
    navigate('/upload');
  };

  return (
    <div className="results-container">
      <div className="results-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      <Navbar isVisible={isVisible} />

      <div className={`results-content ${isVisible ? 'content-visible' : ''}`}>
        
        {/* Header */}
        <div className="results-header">
          <div className="results-title-section">
            <h1>Prescription Results</h1>
            <p>We found {medicines.length} medicines in your prescription</p>
          </div>

          <div className="results-actions">
            <button className="action-btn primary" onClick={handleNewScan}>
              New Scan
            </button>
          </div>
        </div>

        {/* Medicines */}
        {medicines.length === 0 ? (
          <div className="empty-state">
            <h2>⚠️ No clear medicines detected</h2>
            <p>Try uploading a clearer prescription image.</p>
          </div>
        ) : (
          <div className="medicines-grid">
            {medicines.map((medicine, index) => (
              <MedicineCard key={index} medicine={medicine} />
            ))}
          </div>
        )}
        
         
        {/* Disclaimer */}
        <div className="results-disclaimer">
          <p>
            ⚕️ This information is AI-generated. Please consult a doctor before taking any medication.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Results;