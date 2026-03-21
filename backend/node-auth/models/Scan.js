const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: String,
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
  medicines: [medicineSchema],
  rawText: String, // optional but powerful
}, {
  timestamps: true // gives createdAt automatically
});

module.exports = mongoose.model("Scan", scanSchema);