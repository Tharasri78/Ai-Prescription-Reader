from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from gemini import extract_medicines

app = FastAPI()


# -----------------------------
# 🏠 HEALTH CHECK
# -----------------------------
@app.get("/")
def home():
    return {"message": "AI Service Running"}


# -----------------------------
# 📸 SCAN ENDPOINT
# -----------------------------
@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    try:
        # 🔥 Read file
        image_bytes = await file.read()

        if not image_bytes:
            return JSONResponse(
                status_code=400,
                content={
                    "medicines": [],
                    "error": "Empty file uploaded"
                }
            )

        # 🔥 Call Gemini extraction
        result = extract_medicines(image_bytes, file.content_type)

        print("🧠 FINAL RESULT:", result)

        medicines = result.get("medicines", [])

        # 🔥 SAFETY CLEAN (FINAL LAYER)
        cleaned_medicines = []

        for med in medicines:
            name = (med.get("name") or "").strip()

            # skip garbage
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
            "raw_text": str(result)
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