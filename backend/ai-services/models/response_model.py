from pydantic import BaseModel
from typing import List

class Medicine(BaseModel):
    name: str
    dosage: str
    frequency: str

class ScanResponse(BaseModel):
    success: bool
    raw_text: str
    medicines: List[Medicine]