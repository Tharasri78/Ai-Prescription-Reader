import os
import re
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Import our modular pipeline services
from preprocessing import preprocess_image
from ocr_service import extract_raw_ocr_text
from validation import validate_and_score_medicine
from interaction_service import check_drug_interactions

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# Version trackers
PROMPT_VERSION = "v2.4-late-structure"
PREPROCESSING_VERSION = "v1.2-clahe"

def clean_structured_value(val: str) -> str:
    if not val:
        return "N/A"
    # Basic cleanup: remove markdown asterisks
    clean = val.replace("*", "").strip()
    return clean if clean else "N/A"

def structure_raw_ocr_text(ocr_lines: list[str]) -> list[dict]:
    """
    Takes a list of raw text lines and asks Gemini to parse them into 
    structured medicines without hallucinating or inventing drugs.
    """
    if not ocr_lines:
        return []
        
    lines_text = "\n".join(ocr_lines)
    
    prompt = f"""
    You are an advanced medical clinical data structurer. 
    Analyze the following raw OCR text transcribed from a handwritten doctor's prescription.
    Convert this messy transcription into a structured JSON array of medicines.
    
    Raw OCR Text:
    \"\"\"
    {lines_text}
    \"\"\"
    
    Instructions:
    - Identify medicines along with their dosage, frequency, and duration.
    - Output ONLY a valid JSON array of objects with the exact schema:
      [
        {{
          "name": "Medicine Name",
          "dosage": "Dosage (e.g. 500mg, 1 tablet, 5ml)",
          "frequency": "Frequency (e.g. Twice daily, 1-0-1, SOS)",
          "duration": "Duration (e.g. 5 days, 1 week)"
        }}
      ]
    - Do NOT correct spellings of drugs in this stage (leave that to the dictionary layer).
    - If a field is not specified, set it to "N/A".
    - Do NOT write introductory remarks, do NOT wrap the output in markdown block (like ```json), just output the raw JSON string.
    - Absolute compliance: Do NOT invent, assume, or hallucinate medicines that are not supported by the raw OCR transcription lines.
    """
    
    try:
        response = model.generate_content(prompt)
        text_out = getattr(response, "text", "").strip()
        
        # Clean up any potential markdown fences if returned
        if text_out.startswith("```"):
            text_out = re.sub(r'^```(?:json)?\n', '', text_out)
            text_out = re.sub(r'\n```$', '', text_out).strip()
            
        structured_data = json.loads(text_out)
        if isinstance(structured_data, list):
            return structured_data
            
    except Exception as e:
        print(f"❌ Late-Stage Structuring failed: {repr(e)}")
        
    # Manual parsing fallback if JSON fails
    print("⚠️ Structuring JSON decode failed. Falling back to regex parser.")
    parsed = []
    for line in ocr_lines:
        if len(line) < 3:
            continue
        # Split by typical indicators like dashes
        parts = line.split("-")
        if len(parts) >= 2:
            parsed.append({
                "name": parts[0].strip(),
                "dosage": parts[1].strip() if len(parts) > 1 else "N/A",
                "frequency": parts[2].strip() if len(parts) > 2 else "N/A",
                "duration": "N/A"
            })
    return parsed

def extract_medicines(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Full Advanced Presciption Reading Pipeline.
    1. Preprocessing (OpenCV)
    2. OCR (PaddleOCR / Gemini Fallback)
    3. Structuring (Gemini late-stage)
    4. Validation & Fuzzy Name Correction (RapidFuzz & Rules Engine)
    5. Clinical Safety Evaluation (Drug-Drug Interactions)
    6. System Metadata Assembly
    """
    try:
        # Step 1: Preprocess Image
        print("🧼 [1/5] Enhancing image with OpenCV...")
        enhanced_bytes, preproc_meta = preprocess_image(image_bytes)
        
        # Step 2: OCR Raw Line Extraction
        print("🔍 [2/5] Performing text extraction...")
        raw_lines, ocr_conf, ocr_engine, ocr_prompt_ver = extract_raw_ocr_text(enhanced_bytes, mime_type)
        
        if not raw_lines:
            print("❌ No text extracted from prescription.")
            return {
                "medicines": [],
                "interactions": [],
                "error": "Unable to confidently extract medicines. Please upload a clearer prescription.",
                "systemMetadata": {
                    "ocrModelVersion": "Failed",
                    "promptVersion": PROMPT_VERSION,
                    "preprocessingVersion": PREPROCESSING_VERSION
                }
            }
            
        print(f"📝 Raw OCR extracted {len(raw_lines)} lines via {ocr_engine}.")
        
        # Step 3: Late-stage Gemini Structuring
        print("🧠 [3/5] Structuring raw text with Gemini...")
        raw_medicines = structure_raw_ocr_text(raw_lines)
        
        # Step 4: Fuzzy Matching and Clinical Safety Validation
        print("🛡️ [4/5] Running clinical verification & confidence checks...")
        validated_medicines = []
        for med in raw_medicines:
            name_raw = clean_structured_value(med.get("name"))
            dosage_raw = clean_structured_value(med.get("dosage"))
            frequency_raw = clean_structured_value(med.get("frequency"))
            duration_raw = clean_structured_value(med.get("duration"))
            
            if not name_raw or name_raw == "N/A" or len(name_raw) < 2:
                continue
                
            # Run RapidFuzz dictionary matcher and Rules Engine scoring
            validation_report = validate_and_score_medicine(name_raw, dosage_raw, frequency_raw, ocr_conf)
            
            validated_medicines.append({
                "name": validation_report["name"],
                "originalName": validation_report["originalName"],
                "isValid": validation_report["isValid"],
                "confidence": validation_report["confidence"],
                "dosage": validation_report["dosage"],
                "frequency": validation_report["frequency"],
                "duration": duration_raw,
                "safety": validation_report["safety"]
            })
            
        # Step 5: Check Drug-Drug Interactions
        print("⚠️ [5/5] Checking drug-drug interactions...")
        interactions = check_drug_interactions(validated_medicines)
        
        # Compile everything
        response_payload = {
            "medicines": validated_medicines,
            "interactions": interactions,
            "systemMetadata": {
                "ocrModelVersion": ocr_engine,
                "promptVersion": PROMPT_VERSION,
                "preprocessingVersion": PREPROCESSING_VERSION
            },
            "raw_text": "\n".join(raw_lines)
        }
        
        return response_payload
        
    except Exception as e:
        print(f"❌ Main Extraction Pipeline failed: {repr(e)}")
        return {
            "medicines": [],
            "interactions": [],
            "error": f"Extraction failed: {str(e)}",
            "systemMetadata": {
                "ocrModelVersion": "Error",
                "promptVersion": PROMPT_VERSION,
                "preprocessingVersion": PREPROCESSING_VERSION
            }
        }