import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../../components/UploadBox/UploadBox';
import './Upload.css';

const Upload = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleFileSelected = (file) => {
    setSelectedFile(file);
  };

  const handleCameraCapture = () => {
    // Simulate camera capture
    alert('Camera feature would open here');
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/results');
    }, 3000);
  };

  return (
    <div className="upload-container">
      {/* Animated Background */}
      <div className="upload-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      

      {/* Upload Content */}
      <div className={`upload-content ${isVisible ? 'content-visible' : ''}`}>
        <div className="upload-header">
          <h1>Upload Prescription</h1>
          <p>Upload or capture your prescription to get started</p>
        </div>

        <div className="upload-main">
          {/* Use the UploadBox component */}
          <UploadBox 
            onFileSelected={handleFileSelected}
            onCameraCapture={handleCameraCapture}
          />

         
          {/* Process Button */}
          {selectedFile && (
            <button 
              className={`process-btn ${isProcessing ? 'processing' : ''}`}
              onClick={handleUpload}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  Scan Prescription
                  <span className="btn-arrow">→</span>
                </>
              )}
            </button>
          )}

          {/* Info Cards */}
          <div className="upload-info">
            <div className="info-card">
          <div className="info-text">
                <h4>Secure Processing</h4>
                <p>Your images are encrypted and never shared</p>
              </div>
            </div>
            
            <div className="info-card">
              <div className="info-text">
                <h4>Fast Results</h4>
                <p>Get medicine information in seconds</p>
              </div>
            </div>
            
            <div className="info-card">
              
              <div className="info-text">
                <h4>High Accuracy</h4>
                <p>99% accurate medicine recognition</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;