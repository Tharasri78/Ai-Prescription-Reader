import pytesseract
from core.config import TESSERACT_PATH
import cv2

# ✅ SET FIRST
pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


def extract_text(image):
    texts = []

    # original
    text1 = pytesseract.image_to_string(image, config='--oem 3 --psm 6')
    texts.append(text1)

    # threshold
    thresh = cv2.threshold(image, 150, 255, cv2.THRESH_BINARY)[1]
    text2 = pytesseract.image_to_string(thresh, config='--oem 3 --psm 6')
    texts.append(text2)

    # inverted
    inv = cv2.bitwise_not(image)
    text3 = pytesseract.image_to_string(inv, config='--oem 3 --psm 6')
    texts.append(text3)

    best_text = max(texts, key=len)

    print("\n===== OCR TEXT =====\n", best_text)

    return best_text