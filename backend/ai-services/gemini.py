from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import re

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# -----------------------------
# 🔥 CLEAN NAME FUNCTION
# -----------------------------
def clean_name(name: str) -> str:
    if not name:
        return ""
    return (
        re.sub(r'^\d+\.?\s*', '', name)  # remove "1.", "2", "3)"
        .replace("SYP ", "")
        .replace("SYRUP ", "")
        .replace("TAB ", "")
        .replace("CAP ", "")
        .strip()
    )


# -----------------------------
# 🧠 MAIN FUNCTION
# -----------------------------
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
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=[
                types.Content(
                    parts=[
                        types.Part.from_text(text=prompt),
                        types.Part.from_bytes(
                            data=image_bytes,
                            mime_type=mime_type
                        )
                    ]
                )
            ]
        )

        text = (response.text or "").strip()
        print("🧠 RAW OUTPUT:\n", text)

        medicines = []
        lines = text.split("\n")

        for line in lines:
            if not line.strip():
                continue

            # 🔥 remove numbering (1. , 2. etc)
            clean_line = re.sub(r'^\d+[\.\)]?\s*', '', line.strip())

            # 🔥 normalize "1 - 0 - 1" → "1-0-1"
            clean_line = re.sub(
                r'(\d)\s*-\s*(\d)\s*-\s*(\d)',
                r'\1-\2-\3',
                clean_line
            )

            # 🔥 SAFE SPLIT (VERY IMPORTANT)
            parts = clean_line.split(" - ", 3)

            # Debug (keep for testing, remove later)
            print("LINE:", clean_line)
            print("PARTS:", parts)

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

        # ✅ SUCCESS
        if medicines:
            return {"medicines": medicines}

        # 🔥 FALLBACK (extract names only)
        names = re.findall(r'[A-Z][a-zA-Z\-]+(?:\s\d+mg)?', text)

        if names:
            return {
                "medicines": [
                    {
                        "name": clean_name(n),
                        "dosage": "",
                        "frequency": "",
                        "duration": ""
                    }
                    for n in names[:5]
                ]
            }

    except Exception as e:
        print("❌ GEMINI ERROR:", str(e))

    # ❌ FINAL FALLBACK
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