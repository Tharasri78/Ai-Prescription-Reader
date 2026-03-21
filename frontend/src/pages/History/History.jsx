import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { scanService } from "../../services/api";
import Navbar from "../../components/Navbar/Navbar";
import "./History.css";

const History = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const scrollContainerRef = useRef(null);

  // Scroll buttons
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setIsVisible(true);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await scanService.getHistory();
      setScans(res.scans || []);
      setError("");
    } catch (err) {
      console.error("History fetch failed:", err);
      setError("Failed to load scan history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScan = async (scanId, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this scan from history?")) {
      try {
        await scanService.deleteScan(scanId);
        setScans(scans.filter(scan => scan._id !== scanId));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };
    const formatDate = (dateString) => {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};
   
  const getMedicineIcon = (name) => {
    const icons = {
      'paracetamol': '',
      'azithromycin': '',
      'amoxicillin': '',
      'ibuprofen': '',
      'metformin': '',
      'amlodipine': '',
      'omeprazole': ''
    };
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key)) return icon;
    }
    return '';
  };

  return (
    <div className="history-container">
      {/* Animated Background */}
      <div className="history-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element pulse">💊</div>
        <div className="floating-element float">📋</div>
        <div className="floating-element spin">🩺</div>
        <div className="floating-element bounce">🏥</div>
      </div>

      {/* Navbar */}
      <Navbar isVisible={isVisible} />

      {/* History Content */}
      <div className={`history-content ${isVisible ? 'content-visible' : ''}`}>
        <div className="history-header">
          <h1>Scan History</h1>
          <p>Swipe horizontally to browse your scans</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your history...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchHistory}>
              Try Again
            </button>
          </div>
        ) : scans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Scans Yet</h3>
            <p>Your first prescription scan will appear here</p>
            <button className="scan-btn" onClick={() => navigate('/upload')}>
              Upload Prescription
              <span className="btn-arrow">→</span>
            </button>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="history-stats">
              <div className="stat-card">
                <div className="stat-number">{scans.length}</div>
                <div className="stat-label">Total Scans</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {scans.reduce((total, scan) => total + (scan.medicines?.length || 0), 0)}
                </div>
                <div className="stat-label">Medicines</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {scans.filter(scan => scan.medicines?.length > 0).length}
                </div>
                <div className="stat-label">Successful</div>
              </div>
            </div>

            {/* Horizontal Scroll Container */}
            <div className="horizontal-scroll-container">
              <button className="scroll-btn scroll-left" onClick={scrollLeft}>
                ‹
              </button>
              
              <div className="scans-horizontal" ref={scrollContainerRef}>
                {scans.map((scan, index) => (
                  <div
                    key={scan._id || index}
                    className="scan-card-horizontal"
                    onClick={(e) => {
  e.stopPropagation();
  navigate(`/results?scanId=${scan._id}`);
}}
                  >
                    <div className="card-header">
                      <div className="date-badge">
                        <span className="date-text">{formatDate(scan.createdAt)}</span>
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={(e) => handleDeleteScan(scan._id, e)}
                      >
                        -
                      </button>
                    </div>

                    <div className="medicine-count-badge">
                      <span className="count-number">{scan.medicines?.length || 0}</span>
                      <span className="count-text">medicines</span>
                    </div>

                    <div className="medicines-preview">
                      {scan.medicines && scan.medicines.length > 0 ? (
                        scan.medicines.slice(0, 3).map((med, i) => (
                          <div key={i} className="preview-medicine">
                            <span className="preview-icon">{getMedicineIcon(med.name)}</span>
                            <span className="preview-name">{med.name}</span>
                            {med.dosage && <span className="preview-dosage">{med.dosage}</span>}
                          </div>
                        ))
                      ) : (
                        <div className="no-medicines-preview">
                          <span>⚠️</span>
                          <span>No medicines detected</span>
                        </div>
                      )}
                      {scan.medicines?.length > 3 && (
                        <div className="more-medicines">
                          +{scan.medicines.length - 3} more
                        </div>
                      )}
                    </div>

                    <div className="card-footer">
                      
                    </div>
                  </div>
                ))}
              </div>

              <button className="scroll-btn scroll-right" onClick={scrollRight}>
                ›
              </button>
            </div>

            {/* Mobile swipe hint */}
            <div className="swipe-hint-mobile">
              <span>👈 Swipe horizontally to see more 👉</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;