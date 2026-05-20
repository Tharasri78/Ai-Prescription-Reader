import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# Detect and handle PaddleOCR availability
PADDLE_AVAILABLE = False
paddle_ocr_engine = None

try:
    # Try importing paddleocr
    from paddleocr import PaddleOCR as PaddleOCRClass
    # Initialize PaddleOCR engine (lazy loaded on first request to speed up startup)
    PADDLE_AVAILABLE = True
except ImportError:
    print("ℹ️ PaddleOCR package not installed. Gemini Vision will act as primary OCR engine.")
except Exception as e:
    print(f"⚠️ PaddleOCR initialization error: {repr(e)}. Falling back to Gemini.")

def get_paddle_ocr_engine():
    global paddle_ocr_engine
    if PADDLE_AVAILABLE and paddle_ocr_engine is None:
        try:
            # use_angle_cls=True helps correct text rotation, show_log=False keeps terminal clean
            paddle_ocr_engine = PaddleOCRClass(use_angle_cls=True, lang="en", show_log=False)
        except Exception as e:
            print(f"⚠️ Failed to instantiate PaddleOCR: {repr(e)}. Setting PADDLE_AVAILABLE = False")
            globals()["PADDLE_AVAILABLE"] = False
    return paddle_ocr_engine

def run_paddle_ocr(image_bytes: bytes) -> tuple[list[str], float, str]:
    """Runs PaddleOCR on the image and returns raw text lines and average confidence."""
    import cv2
    import numpy as np
    
    engine = get_paddle_ocr_engine()
    if not engine:
        raise RuntimeError("PaddleOCR engine not loaded")
        
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Failed to load image for PaddleOCR")
        
    # Run OCR inference
    result = engine.ocr(img, cls=True)
    
    extracted_lines = []
    confidence_sum = 0.0
    confidence_count = 0
    
    if result and result[0]:
        for line in result[0]:
            # Each line has structure: [ [ [x,y] coordinates... ], (text_string, confidence_score) ]
            box_info, (text, conf) = line
            text_clean = text.strip()
            if text_clean:
                extracted_lines.append(text_clean)
                confidence_sum += float(conf)
                confidence_count += 1
                
    avg_conf = (confidence_sum / confidence_count) if confidence_count > 0 else 0.5
    return extracted_lines, avg_conf, "PaddleOCR v4"

def run_gemini_vision_ocr(image_bytes: bytes, mime_type: str = "image/jpeg") -> tuple[list[str], float, str]:
    """
    Fallback OCR using Gemini Vision. Instructs Gemini to perform purely raw text transcription.
    """
    prompt = """
    You are a highly precise medical OCR engine.
    Your sole task is to transcribe all text found in this preprocessed prescription image.
    
    Rules:
    - Output ONLY the raw lines of text exactly as they are written in the image.
    - One line per block of text.
    - Do NOT format, structure, correct spelling, or invent details.
    - Do NOT output JSON, explanations, or introductory text.
    """
    
    try:
        response = model.generate_content(
            [
                prompt,
                {"mime_type": mime_type, "data": image_bytes}
            ]
        )
        
        raw_text = getattr(response, "text", None)
        if not raw_text:
            raise ValueError("Gemini Vision returned an empty text response.")
            
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        
        # Since Gemini Vision doesn't output numerical token confidence natively,
        # we assign a highly reliable baseline score of 0.85 since Gemini is exceptionally accurate.
        return lines, 0.85, "Gemini Vision Fallback"
        
    except Exception as e:
        print(f"❌ Gemini Vision OCR failed: {repr(e)}")
        return [], 0.0, "Failed"

def extract_raw_ocr_text(image_bytes: bytes, mime_type: str = "image/jpeg") -> tuple[list[str], float, str, str]:
    """
    Tries primary PaddleOCR first, and gracefully falls back to Gemini Vision on failure/uninstalled.
    Returns (raw_lines, ocr_confidence, engine_name, prompt_version).
    """
    global PADDLE_AVAILABLE
    
    lines = []
    confidence = 0.0
    engine_name = "None"
    prompt_version = "v1.0-raw-transcribe"
    
    # Try PaddleOCR if package is available
    if PADDLE_AVAILABLE:
        try:
            print("🚀 Executing primary OCR: PaddleOCR...")
            lines, confidence, engine_name = run_paddle_ocr(image_bytes)
            if lines:
                return lines, confidence, engine_name, "N/A"
            else:
                print("⚠️ PaddleOCR returned empty text. Cascading to Gemini Vision...")
        except Exception as e:
            print(f"⚠️ PaddleOCR execution failed: {repr(e)}. Cascading to Gemini Vision...")
            
    # Fallback/Primary to Gemini Vision
    print("🚀 Executing OCR: Gemini Vision...")
    lines, confidence, engine_name = run_gemini_vision_ocr(image_bytes, mime_type)
    return lines, confidence, engine_name, prompt_version
