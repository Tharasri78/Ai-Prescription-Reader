from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from gemini import extract_medicines
import asyncio

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

        if not image_bytes:
            return JSONResponse(
                status_code=400,
                content={"medicines": [], "error": "Empty file"}
            )

        # 🔥 FIX: DEFINE MIME TYPE
        mime_type = file.content_type or "image/jpeg"
        

        print("🚀 Running AI...")

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(extract_medicines, image_bytes, mime_type),
                timeout=60
            )

            print("✅ AI RESULT:", result)

            # 🔥 SAFE CHECK
            if not isinstance(result, dict):
                raise Exception("Invalid AI response")

            medicines = result.get("medicines", [])

            if not isinstance(medicines, list):
                medicines = []

        except asyncio.TimeoutError:
            print("⏰ AI TIMEOUT")
            return JSONResponse(
                status_code=504,
                content={"medicines": [], "error": "AI timeout"}
            )

        except Exception as ai_error:
            print("❌ AI ERROR:", str(ai_error))
            return JSONResponse(
                status_code=500,
                content={"medicines": [], "error": "AI failed"}
            )

        # -----------------------------
        # 🧹 CLEAN
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
            "raw_text": str(result)[:1000]  # 🔥 SAFE
        }

    except Exception as e:
        print("❌ MAIN ERROR:", str(e))

        return JSONResponse(
            status_code=500,
            content={"medicines": [], "error": str(e)}
        )