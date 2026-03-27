const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

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

    const scans = await Scan.find({ userId: req.user._id })
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
router.post('/prescription', protect , async (req, res) => {
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
        message: 'Image must be less than 5MB'
      });
    }

    // =====================================================
    // 🔥 FIXED: SEND BUFFER INSTEAD OF STREAM
    // =====================================================
    const formData = new FormData();

    console.log("📦 Buffer size:", image.data.length);

       formData.append('file', image.data, image.name);

    const url = `${process.env.PYTHON_AI_URL.replace(/\/$/, '')}/scan`;

    // =====================================================
    // 🔥 FIXED: PROPER CONFIG
    // =====================================================
     const config = {
  headers: {
    ...formData.getHeaders()
  },
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  timeout: 300000
};
console.log("📦 FINAL DATA LENGTH:", image.data.length);

    let aiResponse;

// 🔥 WAKE AI SERVICE FIRST
try {
  await axios.get(`${process.env.PYTHON_AI_URL.replace(/\/$/, '')}/health`);
  console.log("✅ AI service is awake");
} catch (e) {
  console.log("⏳ AI waking up... waiting 5s");
  await new Promise(r => setTimeout(r, 5000));
}

// 🔁 RETRY LOGIC
const callAI = async (retries = 2) => {
  try {
    return await axios.post(url, formData, config);
  } catch (err) {
    console.error("⚠️ AI attempt failed:", err.message);

    if (retries > 0) {
      console.log(`🔁 Retrying AI... (${retries})`);
      await new Promise(r => setTimeout(r, 4000));
      return callAI(retries - 1);
    }

    throw err;
  }
};

try {
  aiResponse = await callAI();
} catch (err) {
  console.error("🔥 FINAL AI FAILURE:");
  console.error("Status:", err.response?.status);
  console.error("Data:", err.response?.data);
  console.error("Message:", err.message);
  throw err;
}

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

    const userId = req.user?._id || req.user?.id || null;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { scansCount: 1 }
      });
    }

    // 🔥 SAVE
    const newScan = await Scan.create({
      userId,
      medicines,
      rawText: JSON.stringify(aiData.raw_text || ""),
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
        message: "Request took too long. Please try again."
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: "AI service not reachable"
      });
    }

     if (error.response) {
  console.log("AI ERROR REAL:", error.response.data);

  return res.status(503).json({
    success: false,
    message: "Service is starting, please try again in a few seconds"
  });
}

    res.status(500).json({
      success: false,
      message: "Scan failed"
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