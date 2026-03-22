import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar'; // Add this import
import UploadBox from '../../components/UploadBox/UploadBox';
import { scanService } from '../../services/api'; // ✅ ADDED
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


  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setIsProcessing(true);

      const data = await scanService.scanPrescription(selectedFile); // ✅ REAL API CALL

      navigate('/results', { state: data }); // ✅ PASS DATA

    } catch (err) {
      console.error(err);
      alert(err.message || "Scan failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="upload-container">
      {/* Animated Background */}
      <div className="upload-gradient-bg">
        <div className="gradient-sphere sphere-1"></div>
        <div className="gradient-sphere sphere-2"></div>
        <div className="gradient-sphere sphere-3"></div>
      </div>

      {/* Add Navbar */}
      <Navbar isVisible={isVisible} />

      {/* Upload Content */}
      <div className={`upload-content ${isVisible ? 'content-visible' : ''}`}>
        <div className="upload-header">
          <h1>Upload Prescription</h1>
          <p>Upload your prescription to get started</p>
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
                  Scanning... 
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