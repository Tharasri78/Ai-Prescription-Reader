import React, { useState } from 'react';
import './UploadBox.css';
import { scanService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const UploadBox = ({ onFileSelected }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // -----------------------
  // DRAG HANDLERS
  // -----------------------
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // -----------------------
  // FILE HANDLING
  // -----------------------
  const handleFile = (file) => {
// 🔥 ADD THESE 3 LINES HERE
  console.log("📦 Selected file:", file);
  console.log("📦 Size:", file?.size);
  console.log("📦 Type:", file?.type);

  // 🔥 HARD VALIDATION
  if (!file) {
    alert("No file selected");
    return;
  }

  if (file.size === 0) {
    alert("File is empty or corrupted");
    return;
  }

  if (file.size < 1000) {
    alert("Invalid file (too small)");
    return;
  }

  console.log("📦 FILE SIZE:", file.size);

  setSelectedFile(file);

  const url = URL.createObjectURL(file);
  setPreviewUrl(url);

  if (onFileSelected) {
    onFileSelected(file);
  }
};

  // -----------------------
  // SCAN FUNCTION (🔥 MAIN FIX)
  // -----------------------
  const handleScan = async () => {
    if (!selectedFile) {
      alert("Select a file first");
      return;
    }

    try {
      setLoading(true);
      setMessage("🔍 Analyzing prescription...");

      const result = await scanService.scanPrescription(selectedFile);

      setMessage("🧠 Extracting medicines...");

      setTimeout(() => {
        navigate('/results', { state: result });
      }, 700);

    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to scan. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------
  // UI
  // -----------------------
  return (
    <div
      className={`upload-box ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'file-selected' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-input"
        className="file-input"
        accept="image/*"
        onChange={handleFileSelect}
      />

      {!selectedFile ? (
        <div className="upload-prompt">
          <div className="upload-icon">📄</div>
          <h3>Drag & Drop</h3>
          <p>or click to browse</p>
          <span className="upload-hint">Supports: JPG, PNG</span>
        </div>
      ) : (
        <div className="file-preview">
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="preview-image" />
          )}

          <div className="file-info">
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>

            <button
              className="change-file-btn"
              disabled={loading}
              onClick={() => document.getElementById('file-input').click()}
            >
              Change
            </button>
          </div>

          {/* 🔥 LOADING UI */}
          {loading && (
            <div className="loading-box">
              <div className="spinner"></div>
              <p>{message}</p>
            </div>
          )}

         

        </div>
      )}
    </div>
  );
};

export default UploadBox;