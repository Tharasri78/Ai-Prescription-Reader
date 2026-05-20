const mongoose = require("mongoose");

const originalMedicineSchema = new mongoose.Schema({
  name: String,
  dosage: String,
  frequency: String,
  duration: String
});

const correctedMedicineSchema = new mongoose.Schema({
  name: String,
  dosage: String,
  frequency: String,
  duration: String
});

const correctionSchema = new mongoose.Schema({
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Scan",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  originalMedicines: [originalMedicineSchema],
  correctedMedicines: [correctedMedicineSchema],
  metrics: {
    editDistanceSum: { type: Number, default: 0 },
    changeRate: { type: Number, default: 0 } // Percentage of fields changed (0 to 100)
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Correction", correctionSchema);
