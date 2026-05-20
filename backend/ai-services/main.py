from fastapi import FastAPI, File, UploadFile, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from gemini import extract_medicines
from rag_service import retrieve_grounded_medicine_guide
from interaction_service import check_drug_interactions
from pydantic import BaseModel
from typing import List
import time

app = FastAPI(title="MediScan AI Core Service", version="2.0.0")

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
    return {"message": "AI Prescription Reader Core Service is online."}

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok", "service": "medi-scan-ai-core"}

# -----------------------------
# 📸 SCAN PRESCRIPTION
# -----------------------------
@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    try:
        print("📥 Received prescription image upload:", file.filename)
        image_bytes = await file.read()

        # Debug logs
        print("📦 File size:", len(image_bytes), "bytes")
        print("📦 Content type:", file.content_type)

        if not image_bytes:
            return JSONResponse(
                status_code=400,
                content={"medicines": [], "interactions": [], "error": "Uploaded image file is empty."}
            )

        mime_type = file.content_type or "image/jpeg"

        print("🚀 Executing AI pipeline...")
        start_time = time.time()
        
        # Execute the full pipeline: Preprocessing -> OCR -> Structuring -> Validation -> Interaction Checking
        result = extract_medicines(image_bytes, mime_type)
        
        duration = time.time() - start_time
        print(f"[SUCCESS] Pipeline completed in {duration:.2f} seconds.")

        # In case of explicit errors flagged inside pipeline
        if "error" in result:
            return JSONResponse(
                status_code=422,
                content=result
            )

        return result

    except Exception as e:
        print("[ERROR] Server error in scan endpoint:", repr(e))
        return JSONResponse(
            status_code=500,
            content={
                "medicines": [],
                "interactions": [],
                "error": f"Internal server error: {str(e)}"
            }
        )

# -----------------------------
# 📚 RAG DRUG RETRIEVAL
# -----------------------------
@app.get("/medicine/info")
def get_medicine_info(name: str = Query(..., description="Name of the medicine to fetch facts for")):
    try:
        print(f"🔍 RAG Lookup request: '{name}'")
        guide = retrieve_grounded_medicine_guide(name)
        return guide
    except Exception as e:
        print("[ERROR] Error in RAG lookup endpoint:", repr(e))
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to retrieve facts: {str(e)}"}
        )

# -----------------------------
# 🛡️ LIVE DRUG-DRUG INTERACTIONS
# -----------------------------
class MedicineItem(BaseModel):
    name: str

class InteractionRequest(BaseModel):
    medicines: List[MedicineItem]

@app.post("/medicine/check-interactions")
def check_interactions_endpoint(req: InteractionRequest):
    try:
        meds_list = [{"name": med.name} for med in req.medicines]
        print(f"🔄 Re-checking safety interactions for: {[m['name'] for m in meds_list]}")
        warnings = check_drug_interactions(meds_list)
        return {"success": True, "interactions": warnings}
    except Exception as e:
        print("[ERROR] Error in check interactions endpoint:", repr(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Failed to check interactions: {str(e)}"}
        )