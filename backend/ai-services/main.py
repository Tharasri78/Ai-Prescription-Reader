from fastapi import FastAPI, File, UploadFile
from PIL import Image
import pytesseract
import cv2
import numpy as np
import re

from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import torch

app = FastAPI()

# -------------------------------
# ⚠️ Tesseract Path (Windows)
# -------------------------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# -------------------------------
# 🔥 Load TrOCR Model
# -------------------------------
print("🔄 Loading TrOCR...")
processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
print("✅ TrOCR Loaded")


# -------------------------------
# ✅ Health Check
# -------------------------------
@app.get("/health")
def health():
    return {"status": "AI running"}


# -------------------------------
# 🧠 Preprocessing (STRONG VERSION)
# -------------------------------
def preprocess_image(image):
    img = np.array(image)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Improve contrast
    gray = cv2.convertScaleAbs(gray, alpha=1.5, beta=20)

    # Denoise
    gray = cv2.medianBlur(gray, 3)

    # Sharpen
    kernel = np.array([[0, -1, 0],
                       [-1, 5,-1],
                       [0, -1, 0]])
    sharp = cv2.filter2D(gray, -1, kernel)

    # Threshold
    thresh = cv2.adaptiveThreshold(
        sharp, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY, 15, 3
    )

    return thresh


# -------------------------------
# 🔥 TrOCR OCR
# -------------------------------
def trocr_ocr(image):
    pixel_values = processor(images=image, return_tensors="pt").pixel_values

    with torch.no_grad():
        generated_ids = model.generate(pixel_values)

    text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return text


# -------------------------------
# 🧪 Tesseract fallback
# -------------------------------
def tesseract_ocr(image):
    return pytesseract.image_to_string(image)


# -------------------------------
# 🔥 Frequency Normalizer
# -------------------------------
def normalize_frequency(freq):
    mapping = {
        "BD": "Twice daily",
        "TDS": "Three times daily",
        "OD": "Once daily",
        "Q8H": "Every 8 hours",
        "AC": "Before meals"
    }
    return mapping.get(freq, freq)


# -------------------------------
# 🧠 Smart Parser
# -------------------------------
def parse_medicines(text):
    medicines = []
    lines = text.split("\n")

    current_med = {}

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Detect new medicine
        if "Tab" in line or "Syp" in line:
            if current_med:
                medicines.append(current_med)
                current_med = {}

            name_match = re.search(r"(Tab|Syp)\s+([A-Za-z\s]+)", line)
            dose_match = re.search(r"(\d+\s*mg|\d+\s*mL)", line)

            name = name_match.group(2).strip() if name_match else None

            if dose_match:
                dose = dose_match.group(1)
                dose = dose.replace("mg", " mg").replace("mL", " mL")
            else:
                dose = None

            current_med["name"] = name
            current_med["dosage"] = dose

        else:
            freq_match = re.search(r"(BD|TDS|OD|Q8H|AC)", line)
            dur_match = re.search(r"(\d+\s*days?)", line)

            if freq_match:
                current_med["frequency"] = normalize_frequency(freq_match.group(1))

            if dur_match:
                current_med["duration"] = dur_match.group(1)

    if current_med:
        medicines.append(current_med)

    return medicines


# -------------------------------
# 🚀 MAIN API
# -------------------------------
@app.post("/scan")
async def scan_prescription(file: UploadFile = File(...)):
    try:
        image = Image.open(file.file).convert("RGB")

        processed = preprocess_image(image)

        # 🔥 Try TrOCR
        try:
            text = trocr_ocr(processed)

            if len(text.strip()) < 5:
                raise Exception("Low confidence")

        except:
            print("⚠️ Using Tesseract fallback")
            text = tesseract_ocr(processed)

        medicines = parse_medicines(text)

        return {
            "success": True,
            "raw_text": text,
            "medicines": medicines
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }