from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from gemini import extract_medicines

app = FastAPI()

# CORS (required for frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/")
def home():
    return {"message": "AI Service Running"}

# Scan endpoint
@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()

        if not image_bytes:
            return JSONResponse(
                status_code=400,
                content={
                    "medicines": [],
                    "error": "Empty file uploaded"
                }
            )

        mime_type = file.content_type or "image/jpeg"

        result = extract_medicines(image_bytes, mime_type)

        medicines = result.get("medicines", [])

        cleaned_medicines = []

        for med in medicines:
            name = (med.get("name") or "").strip()

            if not name or len(name) < 2:
                continue

            cleaned_medicines.append({
                "name": name,
                "dosage": med.get("dosage") or "",
                "frequency": med.get("frequency") or "",
                "duration": med.get("duration") or ""
            })

        return {
            "medicines": cleaned_medicines,
            "raw_text": result
        }

    except Exception as e:
        print("❌ MAIN ERROR:", str(e))

        return JSONResponse(
            status_code=500,
            content={
                "medicines": [],
                "error": "Processing failed"
            }
        )