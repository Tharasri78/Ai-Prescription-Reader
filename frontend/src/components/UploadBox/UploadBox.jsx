import React, { useState } from 'react';
import './UploadBox.css';

const UploadBox = ({ onFileSelected, onCameraCapture }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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

  const handleFile = (file) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

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
        accept="image/*,.pdf"
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
          </div>
          <button 
            className="change-file-btn"
            onClick={() => document.getElementById('file-input').click()}
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadBox;