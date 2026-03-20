const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const validateMedicineName = require("../utils/validateMedicine");


const cleanName = (name) => {
  return name
    ?.replace(/\*\*/g, "")        // remove markdown **
    ?.replace(/^\d+\.?\s*/, "")   // remove "1 ", "2 ", "1."
    ?.replace(/^[-–]\s*/, "")     // remove weird dash prefix
    ?.replace(/^\s+|\s+$/g, "")   // trim
    ?.trim();
};
name: cleanName(result.correctedName),

// @route   POST /scan/prescription
router.post('/prescription', protect, async (req, res) => {
  try {
    // 🔥 FILE CHECK
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const image = req.files.file;

    // 🔥 TYPE VALIDATION
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid image file (JPEG, PNG)'
      });
    }

    // 🔥 SIZE VALIDATION
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size should be less than 5MB'
      });
    }

    // 🔥 SEND IMAGE TO PYTHON
    const formData = new FormData();
    formData.append('file', image.data, image.name);

    console.log(`📤 Sending to Python AI: ${process.env.PYTHON_AI_URL}/scan`);

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
        timeout: 90000
      }
    );

    console.log("✅ AI RESPONSE:", aiResponse.data);

    // 🔥 VALID RESPONSE CHECK
    if (!aiResponse.data || !Array.isArray(aiResponse.data.medicines)) {
      return res.status(200).json({
        success: false,
        message: "AI response invalid. Try again.",
        medicines: []
      });
    }

     // 🔥 VALIDATION + CLEANING LAYER (CORRECT)
const validatedMedicines = aiResponse.data.medicines.map((med) => {

  const result = validateMedicineName(med.name || "");

  const cleaned = cleanName(result.correctedName || med.name);

  return {
    name: cleaned || "Unknown medicine",
    originalName: med.name,

    isValid: result.valid,

    confidence: typeof med.confidence === "number"
      ? med.confidence
      : result.confidence || 0.5,

    dosage: String(med.dosage || "N/A"),
    frequency: String(med.frequency || "N/A"),
    duration: String(med.duration || "N/A")
  };
}); 

     const filteredMedicines = validatedMedicines
  .map(med => ({
    ...med,
    name: cleanName(med.name) // 🔥 second pass clean
  }))
  .filter(med => {
    if (!med.name) return false;

    const name = med.name.toLowerCase();

    return (
      name.length > 2 &&
      !name.includes("interpretation") &&
      !name.includes("note") &&
      !name.includes("based on") &&
      !name.includes("followed")
    );
  });

    // 🔥 UPDATE USER STATS
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { scansCount: 1 }
    });

    // 🔥 FINAL RESPONSE
    return res.json({
      success: true,
      medicines: filteredMedicines,
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

    // 🔥 TIMEOUT HANDLING
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: "Processing is taking longer than expected. Please try again."
      });
    }

    // 🔥 PYTHON SERVICE DOWN
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