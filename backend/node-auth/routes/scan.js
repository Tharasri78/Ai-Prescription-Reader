const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /scan/prescription
// @desc    Upload and process prescription
// @access  Private
router.post('/prescription', protect, async (req, res) => {
  try {
    // Check file
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const image = req.files.file;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid image file (JPEG, PNG)'
      });
    }

    // Validate size
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }

    // 🔥 FIXED: Use buffer instead of temp file
    const formData = new FormData();
    formData.append('file', image.data, image.name);

    console.log(`📤 Sending to Python AI: ${process.env.PYTHON_AI_URL}/scan`);

    // Call Python AI
    const aiResponse = await axios.post(
      `${process.env.PYTHON_AI_URL}/scan`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: req.headers.authorization
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000
      }
    );

    // 🔥 Debug log
    console.log("✅ AI RESPONSE:", aiResponse.data);

    // Update user scan count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { scansCount: 1 }
    });

    // 🔥 Safe response (no crash)
    return res.json({
      success: true,
      medicines: aiResponse.data.medicines || [],
      raw_text: aiResponse.data.raw_text || "",
      message: 'Prescription processed successfully'
    });

  } catch (error) {
    console.error("❌ FULL ERROR DEBUG ↓↓↓");

    if (error.response) {
      console.error("STATUS:", error.response.status);
      console.error("DATA:", error.response.data);
    } else {
      console.error("MESSAGE:", error.message);
    }

    console.error("STACK:", error.stack);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Python AI service is not running'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.response?.data?.detail || error.message || 'AI processing failed'
    });
  }
});

// @route   GET /scan/history
// @desc    Get scan history
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