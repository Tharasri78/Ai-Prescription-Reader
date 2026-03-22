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
    ?.replace(/^\s+|\s+$/g, "")
    ?.trim();
};



// =====================================================
// 📌 1. GET ALL SCANS (HISTORY)
// =====================================================
router.get('/history', protect, async (req, res) => {
  try {
    console.log("USER:", req.user);

    // 🔥 SAFETY CHECK
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const scans = await Scan.find({
      userId: req.user.id   // ✅ SIMPLE & CORRECT
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      scans
    });

  } catch (error) {
    console.error("HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// =====================================================
// 📌 2. SCAN PRESCRIPTION (SAVE DATA)
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

    // 🔥 SEND IMAGE TO PYTHON AI
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
          ...formData.getHeaders(),
        },
        timeout: 90000
      }
    );

    if (!aiResponse.data || !Array.isArray(aiResponse.data.medicines)) {
      return res.status(200).json({
        success: false,
        message: "AI response invalid",
        medicines: []
      });
    }

    // 🔥 CLEAN + VALIDATE MEDICINES
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
        name: cleanName(med.name)
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

    // 🔥 SAVE USER ID (STRING)
    const userId = req.user?.id || null;

    // 🔥 UPDATE USER STATS
     
     if (userId) {
  await User.findByIdAndUpdate(userId, {
    $inc: { scansCount: 1 }
  });
}
    // 🔥 SAVE SCAN
     const newScan = await Scan.create({
  userId,
  medicines: filteredMedicines,
  rawText: aiResponse.data.raw_text || "",
  imageData: image.data.toString("base64"),
  imageName: image.name
});

    res.json({
      success: true,
      medicines: filteredMedicines,
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
        message: "Python AI not running"
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

    res.json({
      success: true,
      scan
    });

  } catch (error) {
    console.error("GET SCAN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Error fetching scan"
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
      message: "Scan deleted"
    });

  } catch (error) {
    console.error("DELETE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
});

module.exports = router;