import React from 'react';
import './MedicineCard.css';

const MedicineCard = ({ medicine }) => {

  const cleanName = (name) => {
    return name?.replace(/^SYP\s*/i, "").trim();
  };

  const extractDuration = (frequency) => {
    if (!frequency) return "N/A";

    let dayMatch = frequency.match(/(\d+)\s*d/i);
    if (dayMatch) return `${dayMatch[1]} days`;

    let weekMatch = frequency.match(/(\d+)\s*week/i);
    if (weekMatch) return `${weekMatch[1]} week${weekMatch[1] > 1 ? 's' : ''}`;

    return "N/A";
  };

  return (
    <div className="medicine-card premium">

      <div className="medicine-card-header">
        <div className="medicine-icon">💊</div>

        <div className="medicine-title">
          <h3>{cleanName(medicine.name)}</h3>
          <p className="medicine-sub">
            {medicine.frequency || "As prescribed"}
          </p>
        </div>
      </div>

      {/* ALWAYS VISIBLE DETAILS */}
      <div className="medicine-details">

        <div className="detail-row">
          <span>Duration</span>
          <strong>{extractDuration(medicine.frequency)}</strong>
        </div>

        <div className="detail-row">
          <span>Instructions</span>
          <strong>Follow doctor's advice</strong>
        </div>

        <div className="detail-row">
          <span>Note</span>
          <strong>Consult doctor if needed</strong>
        </div>

      </div>

    </div>
  );
};

export default MedicineCard;