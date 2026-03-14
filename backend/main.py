from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.prescription import router as prescription_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prescription_router)


@app.get("/")
def root():
    return {"message": "AI Prescription Reader API running"}