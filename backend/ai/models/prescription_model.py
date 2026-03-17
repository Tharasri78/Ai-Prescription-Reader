from pydantic import BaseModel
from typing import List

class Medicine(BaseModel):
    name: str
    explanation: str

class PrescriptionResponse(BaseModel):
    text: str
    medicines: List[Medicine]