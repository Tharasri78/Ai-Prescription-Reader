const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');

const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Scan = require('../models/Scan');
const validateMedicineName = require("../utils/validateMedicine");

// -----------------------------
// 🔧 CLEAN NAME
// -----------------------------
const cleanName = (name) => {
  return name
    ?.replace(/\*\*/g, "")
    ?.replace(/^\d+\.?\s*/, "")
    ?.replace(/^[-–]\s*/, "")
    ?.trim();
};


// =====================================================
// 📌 1. GET ALL SCANS
// =====================================================
router.get('/history', protect, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const scans = await Scan.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ success: true, scans });

  } catch (error) {
    console.error("HISTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// =====================================================
// 📌 2. SCAN PRESCRIPTION
// =====================================================
router.post('/prescription', async (req, res) => {
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
        message: 'Invalid image format'
      });
    }

    // 🔥 SIZE VALIDATION
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image must be < 5MB'
      });
    }

    // 🔥 SEND TO PYTHON AI
    const formData = new FormData();
    formData.append('file', image.data, {
      filename: image.name,
      contentType: image.mimetype
    });

    const aiResponse = await axios.post(
      `${process.env.PYTHON_AI_URL.replace(/\/$/, '')}/scan`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 90000
      }
    );

    const aiData = aiResponse.data;

    if (!aiData || !Array.isArray(aiData.medicines)) {
      return res.status(200).json({
        success: false,
        message: "Invalid AI response",
        medicines: []
      });
    }

    // 🔥 CLEAN + VALIDATE
    const medicines = aiData.medicines
      .map((med) => {
        const result = validateMedicineName(med.name || "");
        const name = cleanName(result.correctedName || med.name);

        return {
          name: name || "Unknown",
          originalName: med.name,
          isValid: result.valid,
          confidence: med.confidence ?? result.confidence ?? 0.5,
          dosage: String(med.dosage || "N/A"),
          frequency: String(med.frequency || "N/A"),
          duration: String(med.duration || "N/A")
        };
      })
      .filter(med => med.name && med.name.length > 2);

    // 🔥 USER (OPTIONAL)
    const userId = req.user?.id || null;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { scansCount: 1 }
      });
    }

    // 🔥 SAVE TO DB (FIXED)
    const newScan = await Scan.create({
      userId,
      medicines,
      rawText: JSON.stringify(aiData), // ✅ FIXED HERE
      imageData: image.data.toString("base64"),
      imageName: image.name
    });

    res.json({
      success: true,
      medicines,
      scanId: newScan._id
    });

  } catch (error) {
    console.error("SCAN ERROR:", error);

    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        message: "AI timeout"
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: "AI not reachable"
      });
    }

    res.status(500).json({
      success: false,
      message: error.response?.data || error.message
    });
  }
});


// =====================================================
// 📌 3. GET SINGLE SCAN
// =====================================================
router.get('/:id', protect, async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found"
      });
    }

    res.json({ success: true, scan });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Fetch failed"
    });
  }
});


// =====================================================
// 📌 4. DELETE SCAN
// =====================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await Scan.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Scan not found"
      });
    }

    res.json({
      success: true,
      message: "Deleted"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
});

module.exports = router;