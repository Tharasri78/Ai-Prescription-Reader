from fastapi import APIRouter, UploadFile
from backend.ai.services.image_processing import save_uploaded_file
from backend.ai.services.ocr_engine import read_prescription
from backend.ai.services.medicine_extractor import extract_medicines
from backend.ai.services.ai_explainer import explain_medicines

router = APIRouter()

@router.post("/upload")
async def upload_prescription(file: UploadFile):
    file_path = save_uploaded_file(file)

    # OCR step
    text = read_prescription(file_path, engine="trocr")

    # 👇 Add this line to debug
    print("OCR Output:", text)

    # Extraction
    medicines = extract_medicines(text)
    explained = explain_medicines(medicines)
    return {"medicines": explained}