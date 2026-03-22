from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from gemini import extract_medicines

app = FastAPI()

# -----------------------------
# 🌐 CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# 🏠 HEALTH
# -----------------------------
@app.get("/")
def home():
    return {"message": "AI Service Running"}

# -----------------------------
# 📸 SCAN
# -----------------------------
@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    try:
        print("📥 File received:", file.filename)

        image_bytes = await file.read()

        # 🔥 DEBUG (DO NOT REMOVE)
        print("📦 FILE SIZE RECEIVED:", len(image_bytes))
        print("📦 MIME TYPE:", file.content_type)

        if not image_bytes:
            return JSONResponse(
                status_code=400,
                content={"medicines": [], "error": "Empty file"}
            )

        mime_type = file.content_type or "image/jpeg"

        print("🚀 Running AI...")

        # 🔥 FINAL FIX (NO ASYNC / THREAD)
        try:
            result = extract_medicines(image_bytes, mime_type)

            print("✅ AI RESULT:", result)

            if not isinstance(result, dict):
                raise Exception("Invalid AI response")

            medicines = result.get("medicines", [])

            if not isinstance(medicines, list):
                medicines = []

        except Exception as ai_error:
            print("❌ AI ERROR FULL:", repr(ai_error))
            return JSONResponse(
                status_code=500,
                content={"medicines": [], "error": str(ai_error)}
            )

        # -----------------------------
        # 🧹 CLEAN OUTPUT
        # -----------------------------
        cleaned = []

        for med in medicines:
            name = (med.get("name") or "").strip()

            if not name or len(name) < 2:
                continue

            cleaned.append({
                "name": name,
                "dosage": med.get("dosage") or "",
                "frequency": med.get("frequency") or "",
                "duration": med.get("duration") or ""
            })

        return {
            "medicines": cleaned,
            "raw_text": str(result)[:1000]
        }

    except Exception as e:
        print("❌ MAIN ERROR:", repr(e))

        return JSONResponse(
            status_code=500,
            content={"medicines": [], "error": str(e)}
        )