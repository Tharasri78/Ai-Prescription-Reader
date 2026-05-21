import re

# Standard medical forms
VALID_FORMS = [
    "tablet", "tab", "capsule", "cap", "syrup", "syp", "injection", "inj",
    "cream", "crm", "ointment", "oint", "gel", "drops", "drp", "inhaler", "inh",
    "suspension", "susp", "powder", "pwd", "spray", "patch"
]

# Clinical daily dosage thresholds for common medications (in mg)
MAX_DAILY_DOSAGE_MG = {
    "paracetamol": 4000,
    "dolo": 4000,
    "calpol": 4000,
    "crocin": 4000,
    "ibuprofen": 2400,
    "amoxicillin": 3000,
    "augmentin": 3000,
    "pantoprazole": 80,
    "omeprazole": 40,
    "cetirizine": 10,
    "azithromycin": 500,
}

def parse_dosage_mg(dosage_str: str) -> float:
    """Extracts numerical mg value from a dosage string (e.g., '650mg' -> 650.0)."""
    if not dosage_str:
        return 0.0
    
    # Search for pattern like '650mg' or '650 mg'
    match = re.search(r'(\d+(?:\.\d+)?)\s*(?:mg|milligram)', dosage_str, re.IGNORECASE)
    if match:
        return float(match.group(1))
    
    # If it is pills (e.g. '1 tablet' or '2 tabs')
    match_pills = re.search(r'(\d+(?:\.\d+)?)\s*(?:tab|cap|pill|tablet|capsule)', dosage_str, re.IGNORECASE)
    if match_pills:
        return float(match_pills.group(1))
        
    return 0.0

def parse_frequency_daily_count(frequency_str: str) -> float:
    """Calculates equivalent daily dose frequency count (e.g. '1-0-1' -> 2.0)."""
    if not frequency_str:
        return 1.0
        
    f_lower = frequency_str.lower()
    
    # 1. 1-0-1 or 1-1-1 notation
    dashes_match = re.findall(r'\d+', f_lower)
    if len(dashes_match) >= 2 and '-' in f_lower:
        try:
            return float(sum(int(x) for x in dashes_match))
        except ValueError:
            pass
            
    # 2. Verbal frequencies
    if "four times" in f_lower or "qid" in f_lower or "1-1-1-1" in f_lower:
        return 4.0
    elif "three times" in f_lower or "thrice" in f_lower or "tid" in f_lower or "1-1-1" in f_lower:
        return 3.0
    elif "twice" in f_lower or "twice daily" in f_lower or "bd" in f_lower or "bid" in f_lower or "1-0-1" in f_lower or "0-1-1" in f_lower or "1-1-0" in f_lower:
        return 2.0
    elif "once" in f_lower or "daily" in f_lower or "od" in f_lower or "bedtime" in f_lower or "morning" in f_lower or "night" in f_lower:
        return 1.0
    elif "alternate" in f_lower or "every other day" in f_lower:
        return 0.5
    elif "sos" in f_lower or "prn" in f_lower or "as needed" in f_lower:
        return 1.0 # default baseline for emergency
        
    return 1.0

def validate_clinical_safety(med_name: str, dosage: str, frequency: str) -> dict:
    """
    Validates a medicine against safety rules.
    Returns a dictionary of safety assessment: { "safe": bool, "warnings": list[str], "review_needed": bool }
    """
    result = {
        "safe": True,
        "warnings": [],
        "review_needed": False
    }
    
    if not med_name:
        return result
        
    med_lower = med_name.lower().strip()
    
    # 1. Validate Form / Route
    # Check if a form term is included in the medicine name or dosage
    form_found = False
    for form in VALID_FORMS:
        if re.search(rf'\b{form}s?\b', med_lower) or re.search(rf'\b{form}s?\b', dosage.lower()):
            form_found = True
            break
            
    # If we can't find a form in a multi-word or long medicine string, check if format looks completely blank
    # (Just a gentle warning rather than rejection)
    if not form_found and len(med_lower) > 3:
        # Note: We won't reject, but suggest review if it is an unrecognized drug form
        pass

    # 2. Check Daily Intake Limits
    daily_count = parse_frequency_daily_count(frequency)
    unit_dose_mg = parse_dosage_mg(dosage)
    
    # Check absolute daily pill limit (generic protection: e.g. more than 6 pills/day is suspicious)
    if daily_count > 6.0:
        result["safe"] = False
        result["warnings"].append(f"High frequency intake detected ({int(daily_count)} times daily). Please verify with a doctor.")
        result["review_needed"] = True
        
    # Check specific chemical dose limits in mg (e.g. Paracetamol max 4000mg)
    total_daily_mg = daily_count * unit_dose_mg
    
    matched_drug = None
    for drug_key, max_allowed in MAX_DAILY_DOSAGE_MG.items():
        if drug_key in med_lower:
            matched_drug = drug_key
            if total_daily_mg > max_allowed:
                result["safe"] = False
                result["warnings"].append(
                    f"Daily dosage of {med_name.capitalize()} ({int(total_daily_mg)}mg) exceeds the safe clinical limit of {max_allowed}mg/day."
                )
                result["review_needed"] = True
            break
            
    # Generic high unit-dose limit (e.g., a single dose > 2000mg is highly irregular)
    if unit_dose_mg > 2000.0 and matched_drug is None:
        result["safe"] = False
        result["warnings"].append(f"Suspiciously high unit dosage detected ({int(unit_dose_mg)}mg). Check decimals or format.")
        result["review_needed"] = True

    # 3. Frequency syntax check
    # Validates frequency conforms to known clinical shorthands or words
    freq_clean = frequency.lower().strip()
    valid_freq_patterns = [
        r'^\d-\d-\d(?:-\d)?$', # 1-0-1, 1-1-1-1
        r'\bonce\b|\btwice\b|\bthrice\b|\bdaily\b|\bweekly\b',
        r'\bod\b|\bbd\b|\btid\b|\bqid\b|\bsos\b|\bprn\b|\bhs\b',
        r'every\s+\d+\s+(?:hour|day|week|hr)',
        r'as\s+directed|bedtime|night|morning'
    ]
    
    if freq_clean and freq_clean != "n/a" and freq_clean != "unknown":
        matched_freq = False
        for pattern in valid_freq_patterns:
            if re.search(pattern, freq_clean):
                matched_freq = True
                break
        if not matched_freq:
            result["warnings"].append(f"Non-standard medicine frequency format: '{frequency}'. Requires pharmacist verification.")
            result["review_needed"] = True

    return result
