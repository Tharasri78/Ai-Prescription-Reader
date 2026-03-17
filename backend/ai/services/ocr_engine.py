import cv2
import numpy as np
from PIL import Image
import pytesseract
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

# Use stronger handwriting model
processor = TrOCRProcessor.from_pretrained("microsoft/trocr-large-handwritten")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-large-handwritten")

def preprocess_image(image_path: str) -> Image.Image:
    """Preprocess image to improve OCR accuracy."""
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    img = cv2.equalizeHist(img)  # increase contrast
    img = cv2.GaussianBlur(img, (3,3), 0)  # reduce noise
    _, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)  # binarize
    return Image.fromarray(img)

def run_trocr(image_path: str) -> str:
    image = preprocess_image(image_path).convert("RGB")
    pixel_values = processor(images=image, return_tensors="pt").pixel_values
    generated_ids = model.generate(pixel_values, max_new_tokens=128, num_beams=4)
    text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
    return text.strip()

def run_tesseract(image_path: str) -> str:
    image = preprocess_image(image_path)
    text = pytesseract.image_to_string(image)
    return text.strip()

def read_prescription(image_path: str, engine: str = "trocr") -> str:
    try:
        if engine == "tesseract":
            return run_tesseract(image_path)
        else:
            text = run_trocr(image_path)
            if len(text) < 5:  # fallback if TrOCR fails
                print("⚠️ TrOCR failed, falling back to Tesseract")
                return run_tesseract(image_path)
            return text
    except Exception as e:
        print(f"OCR error: {e}")
        return run_tesseract(image_path)