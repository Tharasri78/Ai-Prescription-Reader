const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: String,
  originalName: String,
  isValid: { type: Boolean, default: true },
  confidence: { type: Number, default: 1.0 },
  verifiedByHuman: { type: Boolean, default: false },
  dosage: String,
  frequency: String,
  duration: String
});

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  imageUrl: String,
  imageData: String,
  imageName: String,
  medicines: [medicineSchema],
  rawText: String,
  confidence: { type: Number, default: 1.0 },
  needsReview: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'review_needed'],
    default: 'completed'
  },
  interactionWarnings: [String],
  systemMetadata: {
    ocrModelVersion: { type: String, default: "N/A" },
    promptVersion: { type: String, default: "N/A" },
    preprocessingVersion: { type: String, default: "N/A" },
    ocrEngine: { type: String, default: "N/A" },
    llmModel: { type: String, default: "N/A" },
    timings: {
      preprocessing: { type: Number, default: 0.0 },
      ocr: { type: Number, default: 0.0 },
      structuring: { type: Number, default: 0.0 },
      total: { type: Number, default: 0.0 }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Scan", scanSchema);