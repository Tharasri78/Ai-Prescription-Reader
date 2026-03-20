import React, { useState } from 'react';
import './MedicineCard.css';

const MedicineCard = ({ medicine }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cleanName = (name) => {
    return name?.replace(/^SYP\s*/i, "").trim();
  };

  const extractDuration = (frequency) => {
    if (!frequency) return "N/A";
    const match = frequency.match(/(\d+)\s*d/i);
    return match ? `${match[1]} days` : "N/A";
  };

  return (
    <div className="medicine-card premium">

      {/* Header */}
      <div className="medicine-card-header">
        <div className="medicine-icon">💊</div>

        <div className="medicine-title">
          <h3>{cleanName(medicine.name)}</h3>
          <p className="medicine-sub">
            {medicine.frequency || "As prescribed"}
          </p>
        </div>

        <button 
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div className="medicine-details">

          <div className="detail-row">
            <span>Duration</span>
            <strong>{extractDuration(medicine.frequency)}</strong>
          </div>

          <div className="detail-row">
            <span>Instructions</span>
            <strong>{medicine.instructions || "Follow doctor's advice"}</strong>
          </div>

          <div className="detail-row">
            <span>Note</span>
            <strong>Consult doctor if needed</strong>
          </div>

        </div>
      )}

    </div>
  );
};

export default MedicineCard;