const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: String,
  originalName: String,
  isValid: { type: Boolean, default: true },
  confidence: { type: Number, default: 1.0 },
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
  interactionWarnings: [String],
  systemMetadata: {
    ocrModelVersion: { type: String, default: "N/A" },
    promptVersion: { type: String, default: "N/A" },
    preprocessingVersion: { type: String, default: "N/A" }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Scan", scanSchema);