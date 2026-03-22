import google.generativeai as genai
import os
from dotenv import load_dotenv
import re

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


def clean_name(name: str) -> str:
    if not name:
        return ""
    return (
        re.sub(r'^\d+\.?\s*', '', name)
        .replace("SYP ", "")
        .replace("SYRUP ", "")
        .replace("TAB ", "")
        .replace("CAP ", "")
        .strip()
    )


def extract_medicines(image_bytes, mime_type):

    prompt = """
Read this prescription image and extract medicines.

STRICT FORMAT:
Medicine Name - Dosage - Frequency - Duration

Rules:
- One medicine per line
- No numbering
- No explanation
"""

    try:
        response = model.generate_content(
            [
                prompt,
                {"mime_type": mime_type, "data": image_bytes}
            ]
        )

        text = (response.text or "").strip()
        print("🧠 RAW OUTPUT:\n", text)

        medicines = []
        lines = text.split("\n")

        for line in lines:
            if not line.strip():
                continue

            clean_line = re.sub(r'^\d+[\.\)]?\s*', '', line.strip())
            clean_line = re.sub(r'(\d)\s*-\s*(\d)\s*-\s*(\d)', r'\1-\2-\3', clean_line)

            parts = clean_line.split(" - ", 3)

            name = clean_name(parts[0]) if len(parts) > 0 else ""
            dosage = parts[1] if len(parts) > 1 else ""
            frequency = parts[2] if len(parts) > 2 else ""
            duration = parts[3] if len(parts) > 3 else ""

            if len(name) < 3:
                continue

            medicines.append({
                "name": name.strip(),
                "dosage": dosage.strip(),
                "frequency": frequency.strip(),
                "duration": duration.strip()
            })

        if medicines:
            return {"medicines": medicines}

    except Exception as e:
        print("❌ GEMINI ERROR:", str(e))

    return {
        "medicines": [
            {
                "name": "Check prescription manually",
                "dosage": "",
                "frequency": "",
                "duration": ""
            }
        ]
    }