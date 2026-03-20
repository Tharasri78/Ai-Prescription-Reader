from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import json

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_medicines(image_bytes, mime_type):

    prompt = """
Extract medicines from this prescription.

Return ONLY JSON:
{
  "medicines": [
    {
      "name": "",
      "dosage": "",
      "frequency": ""
    }
  ]
}
"""

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

    text = response.text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(text)
    except:
        return {"raw": text}