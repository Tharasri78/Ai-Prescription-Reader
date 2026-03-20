const stringSimilarity = require("string-similarity");
const medicines = require("../data/medicines.json");

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/\d+mg/g, "")     // remove mg
    .replace(/\d+ml/g, "")     // remove ml
    .replace(/[^a-z0-9]/g, ""); // remove symbols
}

function validateMedicineName(name) {
  if (!name) {
    return {
      valid: false,
      correctedName: name,
      confidence: 0
    };
  }

  // 🔥 CLEAN INPUT NAME
  const cleanInput = normalize(name);

  // 🔥 CLEAN DATASET
  const cleanedMedicines = medicines.map(med => normalize(med));

  const match = stringSimilarity.findBestMatch(
    cleanInput,
    cleanedMedicines
  );

  const bestMatch = match.bestMatch;

  // Get original name from dataset
  const originalMatch = medicines[match.bestMatchIndex];

  // 🔥 THRESHOLD
  if (bestMatch.rating > 0.5) {
    return {
      valid: true,
      correctedName: originalMatch,
      confidence: bestMatch.rating
    };
  }

  return {
    valid: false,
    correctedName: name,
    confidence: bestMatch.rating
  };
}

module.exports = validateMedicineName;