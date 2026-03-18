from fastapi import FastAPI, File, UploadFile
from PIL import Image

from services.ocr_service import extract_text
from services.preprocess_service import preprocess_image
from services.correction_service import correct_text
from services.parser_service import parse_medicines
from models.response_model import ScanResponse

app = FastAPI()

@app.post("/scan", response_model=ScanResponse)
async def scan(file: UploadFile = File(...)):
    image = Image.open(file.file).convert("RGB")

    processed = preprocess_image(image)

    text = extract_text(processed)

    text = correct_text(text)

    medicines = parse_medicines(text)

    return {
        "success": True,
        "raw_text": text,
        "medicines": medicines
    }
    
    
    
