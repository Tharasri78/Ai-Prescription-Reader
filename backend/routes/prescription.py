from fastapi import APIRouter, UploadFile, File
import shutil
import os

router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload")
async def upload_prescription(file: UploadFile = File(...)):

    file_path = f"{UPLOAD_FOLDER}/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # dummy response for now
    medicines = [
        {
            "name": "Paracetamol",
            "dose": "500mg",
            "frequency": "Twice daily",
            "explanation": "Used for fever and pain relief"
        }
    ]

    return {"medicines": medicines}