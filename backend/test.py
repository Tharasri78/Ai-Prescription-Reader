from backend.ai.services.ocr_engine import extract_text

text = extract_text("test.png")

print(text)