
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import MedicineCard from '../../components/MedicineCard/MedicineCard';
import { scanService } from '../../services/api';
import './Results.css';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [scanImage, setScanImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const params = new URLSearchParams(location.search);
    const scanId = params.get("scanId");

    if (scanId) {
      fetchScan(scanId);
    } else if (location.state?.medicines) {
      setMedicines(location.state.medicines);
      setLoading(false);
    } else {
      navigate('/upload');
    }
  }, []);

  const fetchScan = async (id) => {
    try {
      const res = await scanService.getScanById(id);

      if (res.success) {
        setMedicines(res.scan.medicines || []);
        setScanImage(res.scan.imageData || null);
      } else {
        navigate('/upload');
      }
    } catch (err) {
      console.error("❌ Failed to load scan:", err);
      navigate('/upload');
    } finally {
      setLoading(false);
    }
  };

  const handleNewScan = () => {
    navigate('/upload');
  };

  const handleBack = () => {
    navigate('/history');
  };

  return (
    <div className="results-container">

      {/* BACKGROUND */}
      <div className="results-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      <Navbar isVisible={isVisible} />

      <div className={`results-content ${isVisible ? 'content-visible' : ''}`}>

        {/* HEADER */}
        <div className="results-header">
          <div className="results-title-section">
            <h1>Prescription Results</h1>
            <p>
              {loading
                ? "Loading..."
                : `We found ${medicines.length} medicine${medicines.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="results-actions">
            <button className="action-btn secondary" onClick={handleBack}>
              ← Back to History
            </button>
            <button className="action-btn primary" onClick={handleNewScan}>
              New Scan
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>

        {/* 🔥 FULL PRESCRIPTION IMAGE DISPLAY 🔥 */}
        {scanImage && (
          <div className="prescription-image-section">
            <div className="image-header">
              <h3> Uploaded Prescription</h3>
              
            </div>
            <div className={`image-container ${showFullImage ? 'expanded' : ''}`}>
              <img
                src={`data:image/jpeg;base64,${scanImage}`}
                alt="Prescription"
                className="prescription-image"
                onClick={() => setShowFullImage(!showFullImage)}
              />
              <div className="image-overlay">
                <span>Click to {showFullImage ? 'minimize' : 'expand'}</span>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading results...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="empty-state">
            <h2>⚠️ No medicines detected</h2>
            <p>Try uploading a clearer prescription image.</p>
          </div>
        ) : (
          <>
            {/* MEDICINES GRID */}
            <div className="medicines-grid">
              {medicines.map((medicine, index) => (
                <MedicineCard key={index} medicine={medicine} />
              ))}
            </div>

            
          </>
        )}

        {/* DISCLAIMER */}
        <div className="results-disclaimer">
          <p>
            ⚕️ This information is AI-generated. Always consult a doctor or pharmacist 
            before taking any medication.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Results;