from fastapi import FastAPI, File, UploadFile
from gemini import extract_medicines

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Service Running"}

@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    image_bytes = await file.read()

    result = extract_medicines(image_bytes, file.content_type)

    return {
        "medicines": result.get("medicines", []),
        "raw_text": str(result)
    }