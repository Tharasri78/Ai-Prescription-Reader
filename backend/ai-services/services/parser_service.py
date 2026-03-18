import re
from difflib import SequenceMatcher
from services.medicine_db_service import load_medicines, save_medicine
from services.medicine_map import MEDICINE_MAP
KNOWN_MEDS = load_medicines()


def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()


def match_medicine(word):
    best_match = None
    best_score = 0

    for med in KNOWN_MEDS:
        score = similarity(word, med)
        if score > best_score:
            best_score = score
            best_match = med

    if best_score > 0.45:
        return best_match

    return None


def parse_medicines(text):
    medicines = []
    seen = set()

    lines = text.lower().split("\n")

    for line in lines:
        if len(line) < 5:
            continue

        if not any(x in line for x in ["tab", "syp", "cap", "mg", "ml", "mls"]):
            continue

        words = re.findall(r'[a-z]+', line)

        candidates = words + [
            f"{words[i]} {words[i+1]}"
            for i in range(len(words)-1)
        ]

        found_name = None

        for word in candidates:
            med = match_medicine(word)
            print("WORD:", word, "→ MATCH:", med)
            if med:
                normalized=MEDICINE_MAP.get(med,med)
                found_name = normalized
                break

        if not found_name:
            continue

        # 🔥 Learn new medicines automatically
        save_medicine(found_name)

        dose = re.search(r'(\d+\s?(mg|ml))', line)
        freq = re.search(r'(bd|tds|od|q\d+h)', line)
        dur = re.search(r'(\d+\s?(d|days))', line)

        obj = {
            "name": found_name.capitalize(),
            "dosage": dose.group(1) if dose else "Unknown",
            "frequency": freq.group(1).upper() if freq else "Unknown",
            "duration": dur.group(1) if dur else "Unknown"
        }

        key = (obj["name"], obj["dosage"])

        if key not in seen:
            medicines.append(obj)
            seen.add(key)

    return medicines