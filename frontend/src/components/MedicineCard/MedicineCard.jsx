import React, { useState } from 'react';
import './MedicineCard.css';

const MedicineCard = ({ medicine }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className="medicine-card" 
      style={{ borderColor: medicine.color || '#667eea' }} // ✅ fallback color
    >
      <div className="medicine-card-header">
        <div className="medicine-icon">💊</div>
        <div className="medicine-title">
          <h3>{medicine.name}</h3>
          <span className="medicine-dose">{medicine.dosage}</span>
        </div>
        <button 
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      <div className="medicine-frequency">
        <span className="frequency-badge">{medicine.frequency}</span>
      </div>

      {/* 🔥 FIX: fallback if description missing */}
      <p className="medicine-description">
        {medicine.description || "No description available"}
      </p>

      {isExpanded && (
        <div className="medicine-details">
          
          {/* 🔥 SHOW DURATION (NEW FIELD FROM AI) */}
          <div className="detail-item">
            <span className="detail-label">Duration:</span>
            <span className="detail-value">
              {medicine.duration || "N/A"}
            </span>
          </div>

          {/* 🔥 SAFE FALLBACKS */}
          <div className="detail-item">
            <span className="detail-label">Instructions:</span>
            <span className="detail-value">
              {medicine.instructions || "Follow doctor's advice"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Side Effects:</span>
            <span className="detail-value">
              {medicine.sideEffects || "Consult doctor if issues occur"}
            </span>
          </div>

        </div>
      )}
    </div>
  );
};

export default MedicineCard;