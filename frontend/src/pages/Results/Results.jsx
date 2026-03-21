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
  const [loading, setLoading] = useState(true);

  // 🔍 GET scanId from URL
  const queryParams = new URLSearchParams(location.search);
  const scanId = queryParams.get("scanId");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    loadData();
  }, [location.state, scanId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // ✅ CASE 1: Coming from Upload
      if (location.state?.medicines) {
        setMedicines(location.state.medicines);
        return;
      }

      // ✅ CASE 2: Coming from History
      if (scanId) {
        const res = await scanService.getScanById(scanId);

        if (res.success) {
          setMedicines(res.scan.medicines || []);
          return;
        }
      }

      // ❌ FALLBACK
      navigate('/upload');

    } catch (err) {
      console.error("Error loading results:", err);
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

      {/* Background */}
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
                : `We found ${medicines.length} medicines`}
            </p>
          </div>

          <div className="results-actions">
            <button className="action-btn secondary" onClick={handleBack}>
              Back
            </button>

            <button className="action-btn primary" onClick={handleNewScan}>
              New Scan
            </button>
          </div>

        </div>

        {/* LOADING */}
        {loading ? (
          <div className="empty-state">
            <h2>⏳ Loading results...</h2>
          </div>
        ) : medicines.length === 0 ? (
          <div className="empty-state">
            <h2>⚠️ No medicines detected</h2>
            <p>Try uploading a clearer prescription image.</p>
          </div>
        ) : (
          <div className="medicines-grid">
            {medicines.map((medicine, index) => (
              <MedicineCard key={index} medicine={medicine} />
            ))}
          </div>
        )}

        {/* DISCLAIMER */}
        <div className="results-disclaimer">
          <p>
            ⚕️ This information is AI-generated. Always consult a doctor.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Results;