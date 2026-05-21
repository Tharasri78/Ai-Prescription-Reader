import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import axios from 'axios';
import './Results.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isVisible, setIsVisible] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [originalMedicines, setOriginalMedicines] = useState([]);
  const [scanImage, setScanImage] = useState(null);
  const [scanId, setScanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullImage, setShowFullImage] = useState(false);

  const [interactionWarnings, setInteractionWarnings] = useState([]);
  const [needsReview, setNeedsReview] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [systemMetadata, setSystemMetadata] = useState(null);

  useEffect(() => {
    setIsVisible(true);

    const params = new URLSearchParams(location.search);
    const id = params.get('scanId');

    if (id) {
      setScanId(id);
      fetchScan(id);
    } else if (location.state?.medicines) {
      const payload = location.state;
      setMedicines(payload.medicines || []);
      setOriginalMedicines(JSON.parse(JSON.stringify(payload.medicines || [])));
      setInteractionWarnings(payload.interactionWarnings || []);
      setNeedsReview(payload.needsReview || false);
      setScanId(payload.scanId || null);
      setSystemMetadata(payload.systemMetadata || null);
      if (payload.scanId) {
        fetchScanImageOnly(payload.scanId);
      } else {
        setLoading(false);
      }
    } else {
      navigate('/upload');
    }
  }, []);

  const fetchScan = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/scan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const scan = res.data.scan;
        setMedicines(scan.medicines || []);
        setOriginalMedicines(JSON.parse(JSON.stringify(scan.medicines || [])));
        setScanImage(scan.imageData || null);
        setInteractionWarnings(scan.interactionWarnings || []);
        setNeedsReview(scan.needsReview || false);
        setSystemMetadata(scan.systemMetadata || null);
      } else {
        navigate('/upload');
      }
    } catch (err) {
      console.error('Failed to load scan:', err);
      setErrorMessage('Could not load prescription results. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const fetchScanImageOnly = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/scan/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setScanImage(res.data.scan.imageData || null);
        setSystemMetadata(res.data.scan.systemMetadata || null);
      }
    } catch (err) {
      console.error('Failed to load image:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSaveCorrections = async () => {
    if (!scanId) {
      setErrorMessage('Temporary scans cannot store corrections. Open this scan from history to save edits.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      const token = localStorage.getItem('token');

      const updateRes = await axios.put(
        `${API_URL}/scan/${scanId}`,
        { medicines },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(
        `${API_URL}/scan/${scanId}/correct`,
        {
          originalMedicines,
          correctedMedicines: medicines
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (updateRes.data.success) {
        setSaveSuccess(true);
        setIsEditing(false);
        setNeedsReview(false);
        setOriginalMedicines(JSON.parse(JSON.stringify(medicines)));
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Correction submission failed:', err);
      setErrorMessage('Failed to save your changes. Please try again.');
    } finally {
      setSaving(false);
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
      <div className="results-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      <Navbar isVisible={isVisible} />

      <div className={`results-content ${isVisible ? 'content-visible' : ''}`}>
        {interactionWarnings.length > 0 && (
          <div className="results-alert-banner">
            <h3>Drug interaction warning</h3>
            <ul>
              {interactionWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="results-header">
          <div className="results-title-section">
            <h1>Scan Results</h1>
            <p>
              {loading
                ? 'Processing your prescription...'
                : `Found ${medicines.length} medicine${medicines.length === 1 ? '' : 's'} in this prescription.`}
            </p>
            {systemMetadata?.timings && (
              <div className="results-meta">
                <span>Processed in {systemMetadata.timings.total}s</span>
              </div>
            )}
          </div>

          <div className="results-actions">
            <button type="button" className="btn-outline" onClick={handleBack}>
              Back to History
            </button>
            <button type="button" className="btn-primary" onClick={handleNewScan}>
              New Scan
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="results-message results-message-error">
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="results-message results-message-success">
            <span>Changes saved successfully.</span>
          </div>
        )}

        {loading ? (
          <div className="results-card results-loading-state">
            <div className="results-spinner"></div>
            <p>Analyzing your prescription...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="results-card results-empty-state">
            <h2>No medicines found</h2>
            <p>We could not read this prescription clearly. Try uploading a sharper image.</p>
            <button type="button" className="btn-primary" onClick={handleNewScan}>
              Upload Again
            </button>
          </div>
        ) : (
          <div className="results-card results-table-card">
            <div className="table-card-header">
              <h3>Extracted medicines</h3>
              <div className="header-controls">
                {needsReview && (
                  <span className="review-tag">Needs review</span>
                )}
                <button
                  type="button"
                  className={`edit-toggle-btn ${isEditing ? 'active' : ''}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Confidence</th>
                    <th>Medicine</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, idx) => {
                    const isLowConfidence = med.confidence < 0.70;
                    return (
                      <tr key={idx} className={isLowConfidence ? 'row-warning' : ''}>
                        <td>
                          <div className="confidence-cell">
                            <span className={`confidence-dot ${isLowConfidence ? 'low' : 'high'}`}></span>
                            <span>{Math.round(med.confidence * 100)}%</span>
                          </div>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => handleCellChange(idx, 'name', e.target.value)}
                              className="table-input"
                            />
                          ) : (
                            <span className="med-name">{med.name}</span>
                          )}
                          {isLowConfidence && !isEditing && (
                            <span className="low-conf-helper">Low confidence</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleCellChange(idx, 'dosage', e.target.value)}
                              className="table-input"
                            />
                          ) : (
                            med.dosage
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => handleCellChange(idx, 'frequency', e.target.value)}
                              className="table-input"
                            />
                          ) : (
                            med.frequency
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => handleCellChange(idx, 'duration', e.target.value)}
                              className="table-input"
                            />
                          ) : (
                            med.duration
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {isEditing && (
              <div className="table-save-action">
                <button
                  type="button"
                  className="save-corrections-btn"
                  onClick={handleSaveCorrections}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {scanImage && (
          <div className="results-card results-image-card">
            <div className="image-card-header">
              <h3>Prescription image</h3>
              <button
                type="button"
                className="expand-toggle"
                onClick={() => setShowFullImage(!showFullImage)}
              >
                {showFullImage ? 'Minimize' : 'Expand'}
              </button>
            </div>
            <div className={`results-img-container ${showFullImage ? 'expanded' : ''}`}>
              <img
                src={`data:image/jpeg;base64,${scanImage}`}
                alt="Prescription"
                className="source-scan-image"
                onClick={() => setShowFullImage(!showFullImage)}
              />
              <p className="image-click-hint">Click image to expand</p>
            </div>
          </div>
        )}

        <div className="results-disclaimer">
          <p>
            <strong>Disclaimer:</strong> AI-generated results may contain errors. Always verify medicines and dosages with your doctor or pharmacist before use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Results;
