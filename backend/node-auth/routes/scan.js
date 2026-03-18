const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /scan/prescription
// @desc    Upload and process prescription
// @access  Private
router.post('/prescription', protect, async (req, res) => {
  try {
    // Check if file exists
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const image = req.files.file;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid image file (JPEG, PNG)'
      });
    }

    // Validate file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }

    // Create form data for Python AI
    const formData = new FormData();
    formData.append('file', fs.createReadStream(image.tempFilePath));

    // FIXED LOG
    console.log(`📤 Sending to Python AI: ${process.env.PYTHON_AI_URL}/scan`);

    // Call Python AI service
    const aiResponse = await axios.post(
      `${process.env.PYTHON_AI_URL}/scan`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': req.headers.authorization
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000 // 30 second timeout
      }
    );

    // Update user's scan count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { scansCount: 1 }
    });

    // Clean up temp file
    fs.unlinkSync(image.tempFilePath);

    // Return results
    res.json({
      success: true,
      medicines: aiResponse.data.medicines,
      raw_text: aiResponse.data.raw_text,
      message: 'Prescription processed successfully'
    });

  } catch (error) {
    console.error('Scan error:', error);

    // FIXED CLEANUP
    if (req.files?.file?.tempFilePath && fs.existsSync(req.files.file.tempFilePath)) {
      fs.unlinkSync(req.files.file.tempFilePath);
    }

    // Handle specific errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is unavailable. Please try again later.'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'AI processing failed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error processing prescription'
    });
  }
});

// @route   GET /scan/history
// @desc    Get user's scan history (placeholder)
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      scansCount: req.user.scansCount,
      message: 'Scan history feature coming soon'
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching history'
    });
  }
});

module.exports = router;