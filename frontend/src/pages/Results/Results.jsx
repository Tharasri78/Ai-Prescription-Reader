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
  
  // Safety and clinical alerts
  const [interactionWarnings, setInteractionWarnings] = useState([]);
  const [needsReview, setNeedsReview] = useState(false);
  
  // Interactive editing state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // RAG side-drawer state
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [ragDetails, setRagDetails] = useState(null);
  const [loadingRAG, setLoadingRAG] = useState(false);
  
  // Pipeline metadata & latencies
  const [systemMetadata, setSystemMetadata] = useState(null);

  useEffect(() => {
    setIsVisible(true);

    const params = new URLSearchParams(location.search);
    const id = params.get("scanId");

    if (id) {
      setScanId(id);
      fetchScan(id);
      } else if (location.state?.medicines) {
      // Direct scan result payload from Upload
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
        // Deep copy original medicines to compare later
        setOriginalMedicines(JSON.parse(JSON.stringify(scan.medicines || [])));
        setScanImage(scan.imageData || null);
        setInteractionWarnings(scan.interactionWarnings || []);
        setNeedsReview(scan.needsReview || false);
        setSystemMetadata(scan.systemMetadata || null);
      } else {
        navigate('/upload');
      }
    } catch (err) {
      console.error("❌ Failed to load scan:", err);
      setErrorMessage("Could not load prescription results. Please check your network.");
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
      console.error("❌ Failed to load image:", err);
    } finally {
      setLoading(false);
    }
  };

  // RAG Fact Fetching
  const fetchDrugFacts = async (drugName) => {
    try {
      setLoadingRAG(true);
      setSelectedDrug(drugName);
      setRagDetails(null);
      const token = localStorage.getItem('token');
      
      const res = await axios.get(`${API_URL}/scan/prescription/facts?name=${encodeURIComponent(drugName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && res.data.medicine) {
        setRagDetails(res.data);
      } else {
        setRagDetails({
          medicine: drugName,
          activeIngredient: "Unverified",
          summary: "No medical facts found.",
          sideEffects: "Unknown",
          precautions: "Unknown",
          source: "FDA Reference Manual"
        });
      }
    } catch (err) {
      console.error("❌ RAG lookup failed:", err);
      setRagDetails({
        medicine: drugName,
        activeIngredient: "Unverified",
        summary: "No medical facts found.",
        sideEffects: "Unknown",
        precautions: "Unknown",
        source: "FDA Reference Manual"
      });
    } finally {
      setLoadingRAG(false);
    }
  };

  // Handle cell edit changes
  const handleCellChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  // Submit human corrections
  const handleSaveCorrections = async () => {
    if (!scanId) {
      setErrorMessage("Temporary scans cannot store corrections. Please verify in historical reports.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      const token = localStorage.getItem('token');

      // 1. Update the Scan in MongoDB
      const updateRes = await axios.put(
        `${API_URL}/scan/${scanId}`,
        { medicines },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Audit/Log the Correction Transaction in MongoDB
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
        // Refresh local memory of original medicines
        setOriginalMedicines(JSON.parse(JSON.stringify(medicines)));
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("❌ Correction submission failed:", err);
      setErrorMessage("Failed to sync clinical review updates to database.");
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
    <div className="results-page">
      <Navbar isVisible={isVisible} />

      <div className={`results-content ${isVisible ? 'content-visible' : ''}`}>

        {/* DRUG-DRUG INTERACTIONS CONTRAINDICATION BANNER */}
        {interactionWarnings.length > 0 && (
          <div className="clinical-alert-banner">
            <div className="banner-title">
              <span className="warning-pulse-dot"></span>
              <h3>CRITICAL CONTRAINDICATION DETECTED</h3>
            </div>
            <ul>
              {interactionWarnings.map((warning, idx) => (
                <li key={idx}>⚠️ {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* HEADER */}
        <div className="results-header">
          <div className="results-title-section">
            <h1>Prescription Review Workspace</h1>
            <p>
              {loading
                ? "Decrypting handwritten notes..."
                : `Pipeline parsed ${medicines.length} medicine rows.`}
            </p>
            {systemMetadata?.timings && (
              <div className="telemetry-chip-container">
                <span className="telemetry-label">Telemetry Latency:</span>
                <span className="telemetry-chip">🔲 Preproc: {systemMetadata.timings.preprocessing}s</span>
                <span className="telemetry-chip">🔍 OCR: {systemMetadata.timings.ocr}s</span>
                <span className="telemetry-chip">🧠 LLM Parse: {systemMetadata.timings.structuring}s</span>
                <span className="telemetry-chip highlight">⚡ Total: {systemMetadata.timings.total}s</span>
              </div>
            )}
          </div>

          <div className="results-actions">
            <button className="btn-secondary" onClick={handleBack}>
              ← Back to History
            </button>
            <button className="btn-primary" onClick={handleNewScan}>
              New Scan
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="workspace-error-alert">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="workspace-success-alert">
            <span>✅ Human review changes committed. System evaluation metrics updated.</span>
          </div>
        )}

        <div className="workspace-grid">
          
          {/* LEFT: RESULTS WORKSPACE */}
          <div className="workspace-main">
            
            {loading ? (
              <div className="results-loading-state">
                <div className="results-spinner"></div>
                <p>Analyzing prescription ink patterns...</p>
              </div>
            ) : medicines.length === 0 ? (
              <div className="results-empty-state">
                <h2>⚠️ Scan Extraction Failure</h2>
                <p>Unable to confidently extract medicines. Please upload a clearer prescription image.</p>
                <button className="btn-primary-small" onClick={handleNewScan}>Retry Upload</button>
              </div>
            ) : (
              <div className="results-table-card">
                <div className="table-card-header">
                  <h3>Extracted Treatment Plan</h3>
                  <div className="header-controls">
                    {needsReview && (
                      <span className="review-tag">⚠️ Verification Needed</span>
                    )}
                    <button 
                      className={`edit-toggle-btn ${isEditing ? 'active' : ''}`}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? 'Cancel Edit' : '✍️ Edit Rows'}
                    </button>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="clinical-table">
                    <thead>
                      <tr>
                        <th>Confidence</th>
                        <th>Medicine name</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Clinical Facts</th>
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
                                <span className="med-name-bold">{med.name}</span>
                              )}
                              {isLowConfidence && !isEditing && (
                                <span className="low-conf-helper">Low OCR certainty</span>
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
                            <td>
                              <button 
                                className="facts-lookup-btn"
                                onClick={() => fetchDrugFacts(med.name)}
                              >
                                🔍 Look Up Fact
                              </button>
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
                      className="save-corrections-btn"
                      onClick={handleSaveCorrections}
                      disabled={saving}
                    >
                      {saving ? 'Syncing...' : '💾 Save Corrections'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* FULL PRESCRIPTION IMAGE DISPLAY */}
            {scanImage && (
              <div className="results-image-card">
                <div className="image-card-header">
                  <h3>Prescription Source Document</h3>
                  <button className="expand-toggle" onClick={() => setShowFullImage(!showFullImage)}>
                    {showFullImage ? 'Minimize Image' : 'Expand Image'}
                  </button>
                </div>
                <div className={`results-img-container ${showFullImage ? 'expanded' : ''}`}>
                  <img
                    src={`data:image/jpeg;base64,${scanImage}`}
                    alt="Prescription Scan Source"
                    className="source-scan-image"
                    onClick={() => setShowFullImage(!showFullImage)}
                  />
                  <p className="image-click-hint">Click image to expand / zoom</p>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT: RAG CLINICAL FACTS SIDEBAR */}
          <div className="workspace-sidebar">
            <div className="sidebar-sticky-card">
              <div className="sidebar-header">
                <h3>Clinical Knowledge Base</h3>
                <span className="sidebar-badge">RAG Module</span>
              </div>
              
              <div className="rag-disclaimer-banner">
                ⚠️ Informational only — not medical advice.
              </div>
              
              {!selectedDrug ? (
                <div className="sidebar-placeholder">
                  <div className="placeholder-icon">📚</div>
                  <p>Click "Look Up Fact" next to any medicine row to fetch grounded active ingredients, warnings, and source details.</p>
                </div>
              ) : loadingRAG ? (
                <div className="sidebar-loading">
                  <div className="results-spinner"></div>
                  <p>Retrieving reference guidelines for <strong>{selectedDrug}</strong>...</p>
                </div>
              ) : ragDetails ? (
                <div className="sidebar-content">
                  <div className="drug-title-area">
                    <h4 className="active-ingredient-header">{ragDetails.medicine}</h4>
                    <span className="ingredient-badge">{ragDetails.activeIngredient}</span>
                  </div>
                  
                  <div className="facts-section">
                    <label>Pharmacist Summary</label>
                    <p className="summary-paragraph">{ragDetails.summary}</p>
                  </div>

                  <div className="facts-section">
                    <label>Common Side Effects</label>
                    <p className="side-effects-text">⚠️ {ragDetails.sideEffects}</p>
                  </div>

                  <div className="facts-section">
                    <label>Clinical Precautions</label>
                    <p className="precautions-text">🛑 {ragDetails.precautions}</p>
                  </div>

                  <div className="source-grounding-badge">
                    <span>Source Grounding: <strong>{ragDetails.source}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="sidebar-error">
                  <p>Failed to query RAG database.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* DISCLAIMER */}
        <div className="results-disclaimer-card">
          <p>
            ⚕️ <strong>Clinical Disclaimer:</strong> MediScan leverages Generative AI and automated clinical safety logic. Always cross-check dosage structures and review labels with a primary care physician before ingestion.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Results;