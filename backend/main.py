from fastapi import FastAPI
from backend.ai.services import prescription
from routes import auth

app = FastAPI()

app.include_router(prescription.router)
app.include_router(auth.router)

@app.get("/")
def home():
    return {"message": "AI Prescription Reader API running"}