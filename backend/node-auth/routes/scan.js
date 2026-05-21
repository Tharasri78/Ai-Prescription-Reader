const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Scan = require('../models/Scan');
const Correction = require('../models/Correction');
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
  timeout: 120000
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
        message: aiData?.error || "Invalid AI response",
        medicines: []
      });
    }

    // 🔥 SAVE SAFETY, METRICS AND CONFIDENCE METADATA
    const medicines = aiData.medicines.map((med) => {
      return {
        name: med.name || "Unknown",
        originalName: med.originalName || med.name || "Unknown",
        isValid: med.isValid ?? true,
        confidence: med.confidence ?? 0.85,
        verifiedByHuman: false,
        dosage: String(med.dosage || "N/A"),
        frequency: String(med.frequency || "N/A"),
        duration: String(med.duration || "N/A")
      };
    });

    const scanConfidence = medicines.length > 0
      ? medicines.reduce((sum, med) => sum + med.confidence, 0) / medicines.length
      : 1.0;

    const needsReview = medicines.some(med => med.confidence < 0.70) || aiData.medicines.some(m => m.safety?.review_needed);

    const interactionWarnings = (aiData.interactions || []).map(inter =>
      `Warning: Unsafe combination of ${inter.med_a} and ${inter.med_b} (${inter.severity}). ${inter.effects}`
    );

    const systemMetadata = {
      ocrModelVersion: aiData.systemMetadata?.ocrModelVersion || "N/A",
      promptVersion: aiData.systemMetadata?.promptVersion || "N/A",
      preprocessingVersion: aiData.systemMetadata?.preprocessingVersion || "N/A",
      ocrEngine: aiData.systemMetadata?.ocrModelVersion || "N/A",
      llmModel: "gemini-2.5-flash",
      timings: aiData.systemMetadata?.timings || {
        preprocessing: 0.0,
        ocr: 0.0,
        structuring: 0.0,
        total: 0.0
      }
    };

    const userId = req.user?._id || req.user?.id || null;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { scansCount: 1 }
      });
    }

    // 🔥 SAVE COMPREHENSIVE SCAN RECORD
    const newScan = await Scan.create({
      userId,
      medicines,
      confidence: scanConfidence,
      needsReview,
      status: needsReview ? 'review_needed' : 'completed',
      interactionWarnings,
      systemMetadata,
      rawText: aiData.raw_text || "",
      imageData: image.data.toString("base64"),
      imageName: image.name
    });

    res.json({
      success: true,
      medicines,
      needsReview,
      interactionWarnings,
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
       
       if (error.response.data && error.response.data.error) {
         return res.status(error.response.status || 422).json({
           success: false,
           message: error.response.data.error
         });
       }

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
// 📌 2.05 GET PRESCRIPTION FACTS (RAG RETRIEVAL PROXY)
// =====================================================
router.get('/prescription/facts', protect, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ success: false, message: "Medicine name is required" });
    }

    console.log(`🔍 Routing RAG Facts request for '${name}' through proxy...`);
    const pythonURL = process.env.PYTHON_AI_URL.replace(/\/$/, '');
    const pythonRes = await axios.get(`${pythonURL}/medicine/info?name=${encodeURIComponent(name)}`, { timeout: 10000 });

    res.json(pythonRes.data);
  } catch (error) {
    console.error("RAG PROXY ERROR:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve facts from AI Service",
      error: error.message
    });
  }
});


// =====================================================
// 📌 2.1 GET SYSTEM HEALTH ANALYTICS
// =====================================================
router.get('/analytics/metrics', protect, async (req, res) => {
  try {
    const scans = await Scan.find({ userId: req.user._id });
    const corrections = await Correction.find({ userId: req.user._id });

    const totalScans = scans.length;
    const reviewedScansCount = scans.filter(s => !s.needsReview).length;
    const reviewNeededCount = scans.filter(s => s.needsReview).length;

    // 1. Average Scan/OCR Confidence
    let avgConfidence = 0;
    if (totalScans > 0) {
      const sumConf = scans.reduce((sum, s) => sum + (s.confidence || 0.0), 0);
      avgConfidence = sumConf / totalScans;
    }

    // 2. Correction Rate (fraction of fields altered)
    let totalScansCorrected = corrections.length;
    let avgChangeRate = 0;
    if (totalScansCorrected > 0) {
      const sumChangeRate = corrections.reduce((sum, c) => sum + (c.metrics?.changeRate || 0), 0);
      avgChangeRate = sumChangeRate / totalScansCorrected;
    }

    // 3. Validation Failures (Scans having clinical warnings or interactions)
    const validationFailuresCount = scans.filter(s => s.interactionWarnings && s.interactionWarnings.length > 0).length;

    // 4. Hallucination Rate estimate (percentage of corrections where a medicine was deleted or completely renamed)
    let hallucinationCount = 0;
    let totalMedsAudited = 0;
    corrections.forEach(c => {
      c.originalMedicines.forEach(orig => {
        totalMedsAudited++;
        const matched = c.correctedMedicines.some(corr =>
          corr.name.toLowerCase().includes(orig.name.toLowerCase()) ||
          orig.name.toLowerCase().includes(corr.name.toLowerCase())
        );
        if (!matched) {
          hallucinationCount++;
        }
      });
    });

    const hallucinationRate = totalMedsAudited > 0 ? (hallucinationCount / totalMedsAudited) * 100 : 0;

    res.json({
      success: true,
      metrics: {
        totalScans,
        avgConfidence: Math.round(avgConfidence * 100),
        avgChangeRate: Math.round(avgChangeRate),
        validationFailuresCount,
        hallucinationRate: Math.round(hallucinationRate),
        reviewNeededCount
      }
    });
  } catch (error) {
    console.error("METRICS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load system metrics" });
  }
});


// =====================================================
// 📌 2.2 UPDATE SCAN (SAVE HUMAN CORRECTION)
// =====================================================
router.put('/:id', protect, async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!Array.isArray(medicines)) {
      return res.status(400).json({ success: false, message: "Medicines must be an array" });
    }

    const originalScan = await Scan.findOne({ _id: req.params.id, userId: req.user._id });
    if (!originalScan) {
      return res.status(404).json({ success: false, message: "Scan not found" });
    }

    // 🔥 1. Re-calculate individual confidence scores and mark human-reviewed fields as 0.95 (clinically high but realistic)
    const updatedMedicines = medicines.map(med => {
      // Find corresponding original medicine
      const originalMed = originalScan.medicines.find(o => String(o._id) === String(med._id) || o.name === med.name);
      
      let hasChanged = true;
      if (originalMed) {
        hasChanged = (
          med.name.toLowerCase().trim() !== originalMed.name.toLowerCase().trim() ||
          med.dosage.toLowerCase().trim() !== originalMed.dosage.toLowerCase().trim() ||
          med.frequency.toLowerCase().trim() !== originalMed.frequency.toLowerCase().trim() ||
          med.duration.toLowerCase().trim() !== originalMed.duration.toLowerCase().trim()
        );
      }
      
      return {
        name: med.name || "Unknown",
        originalName: originalMed ? originalMed.originalName : (med.originalName || med.name || "Unknown"),
        isValid: med.isValid ?? true,
        confidence: hasChanged ? 0.95 : (originalMed ? originalMed.confidence : 0.85),
        verifiedByHuman: hasChanged ? true : (originalMed ? originalMed.verifiedByHuman : false),
        dosage: String(med.dosage || "N/A"),
        frequency: String(med.frequency || "N/A"),
        duration: String(med.duration || "N/A")
      };
    });

    // 🔥 2. Re-calculate overall scan average confidence
    const scanConfidence = updatedMedicines.length > 0
      ? updatedMedicines.reduce((sum, med) => sum + med.confidence, 0) / updatedMedicines.length
      : 0.95;

    // 🔥 3. Call FastAPI to re-verify pairwise drug-drug interactions under corrections with a timeout
    let interactionWarnings = [];
    try {
      console.log("🛡️ Contacting AI interaction service for corrected list...");
      const pythonURL = process.env.PYTHON_AI_URL.replace(/\/$/, '');
      const safetyRes = await axios.post(`${pythonURL}/medicine/check-interactions`, {
        medicines: updatedMedicines.map(m => ({ name: m.name }))
      }, { timeout: 10000 });
      if (safetyRes.data && Array.isArray(safetyRes.data.interactions)) {
        interactionWarnings = safetyRes.data.interactions.map(inter =>
          `Warning: Unsafe combination of ${inter.med_a} and ${inter.med_b} (${inter.severity}). ${inter.effects}`
        );
      }
    } catch (safetyErr) {
      console.error("⚠️ Safety interaction recheck failed:", safetyErr.message);
      // Fallback: preserve original warnings if safety service is unreachable
      interactionWarnings = originalScan.interactionWarnings || [];
    }

    // 🔥 4. Update scan entry in MongoDB
    originalScan.medicines = updatedMedicines;
    originalScan.confidence = scanConfidence;
    originalScan.needsReview = false;
    originalScan.status = 'completed'; // Corrections completed by human review
    originalScan.interactionWarnings = interactionWarnings;
    await originalScan.save();

    res.json({ success: true, scan: originalScan });
  } catch (error) {
    console.error("UPDATE SCAN ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to update scan" });
  }
});


// =====================================================
// 📌 2.3 LOG AUDIT CORRECTION TRAIL
// =====================================================
router.post('/:id/correct', protect, async (req, res) => {
  try {
    const { originalMedicines, correctedMedicines } = req.body;
    if (!Array.isArray(originalMedicines) || !Array.isArray(correctedMedicines)) {
      return res.status(400).json({ success: false, message: "Medicines must be arrays" });
    }

    let diffs = 0;
    const maxLen = Math.max(originalMedicines.length, correctedMedicines.length);

    originalMedicines.forEach((orig, idx) => {
      const corr = correctedMedicines[idx];
      if (!corr) {
        diffs++; // deleted
      } else if (
        orig.name.toLowerCase().trim() !== corr.name.toLowerCase().trim() ||
        orig.dosage.toLowerCase().trim() !== corr.dosage.toLowerCase().trim() ||
        orig.frequency.toLowerCase().trim() !== corr.frequency.toLowerCase().trim()
      ) {
        diffs++; // modified
      }
    });

    if (correctedMedicines.length > originalMedicines.length) {
      diffs += (correctedMedicines.length - originalMedicines.length); // additions
    }

    const changeRate = maxLen > 0 ? (diffs / maxLen) * 100 : 0;

    const correction = await Correction.create({
      scanId: req.params.id,
      userId: req.user._id,
      originalMedicines,
      correctedMedicines,
      metrics: {
        editDistanceSum: diffs,
        changeRate: Math.round(changeRate)
      }
    });

    res.json({ success: true, correction });
  } catch (error) {
    console.error("CORRECTION LOG ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to log correction audit trail" });
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