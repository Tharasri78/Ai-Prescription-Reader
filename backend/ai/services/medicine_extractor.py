import re

def expand_frequency(freq: str) -> str:
    mapping = {
        "OD": "once daily",
        "BD": "twice daily",
        "TDS": "three times daily",
        "Q6H": "every 6 hours",
        "Q8H": "every 8 hours",
        "SOS": "as needed",
        "AC": "before meals",
        "0-0-1": "once daily (night dose)",
        "1-0-1": "twice daily (morning & night)",
        "4-0-4": "apply four times daily"
    }
    return mapping.get(freq.upper(), freq)

def extract_medicines(text: str):
    # Universal regex: catches names, doses, shorthand, circled numbers, durations
    pattern = re.compile(
        r"(?:Tab|Syp|Cream|Oint)?\s*([A-Za-z\-]+(?:\s+[A-Za-z\-]+)*)"   # medicine name
        r"\s*(\d+\s*(?:mg|mL|g))?"                                     # dose
        r"(?:.*?)(OD|BD|TDS|Q\d+H|SOS|AC|\d-\d-\d)?"                    # frequency shorthand
        r"(?:.*?)(?:\(?(\d+)\)?)?"                                     # circled number
        r"\s*(x\s*\d+\s*(?:days|d|tube))?",                            # explicit duration
        re.IGNORECASE
    )

    medicines = []
    for match in pattern.finditer(text):
        name, dose, freq, circled, duration = match.groups()

        # Expand shorthand frequency
        freq_text = expand_frequency(freq.strip()) if freq else ""

        # Adjust wording for topical medicines
        if name and ("cream" in name.lower() or "oint" in name.lower()):
            freq_text = freq_text.replace("take", "apply") if freq_text else "apply as directed"

        # Handle circled numbers as duration if no explicit duration
        duration_text = f"x {circled} days" if circled and not duration else (duration.strip() if duration else "")

        medicines.append({
            "name": name.strip() if name else "Unknown",
            "dose": dose.strip() if dose else "",
            "frequency": freq_text,
            "duration": duration_text
        })

    # Fallback: if regex finds nothing, return raw text
    if not medicines:
        medicines.append({
            "name": "Unparsed Prescription",
            "dose": "",
            "frequency": "",
            "duration": "",
            "explanation": text.strip()
        })

    return medicines