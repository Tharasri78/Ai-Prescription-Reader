import re
from rapidfuzz import process, fuzz
from rules_engine import validate_clinical_safety
from rag_service import search_medicine_details

def validate_and_score_medicine(raw_name: str, dosage: str, frequency: str, ocr_confidence: float) -> dict:
    """
    Validates a medicine entry, performs dictionary matching, runs the safety rules engine,
    and computes a composite Confidence Score.
    """
    name_clean = raw_name.strip()
    
    # 1. Dictionary Matching / Spell Correction via RAG database
    matched_record = search_medicine_details(name_clean)
    
    fuzzy_match_score = 0.0
    corrected_name = name_clean
    is_valid_drug = False
    
    if matched_record:
        # Standardize matching score (0.0 to 1.0)
        corrected_name = matched_record["medicine"]
        # Double check exact match similarity
        similarity = fuzz.WRatio(name_clean.lower(), corrected_name.lower())
        fuzzy_match_score = float(similarity) / 100.0
        
        if similarity > 75.0:
            is_valid_drug = True
    else:
        # Generic fallback score if not present in our local catalog
        fuzzy_match_score = 0.50
        
    # 2. Safety Rules Check
    safety_report = validate_clinical_safety(corrected_name, dosage, frequency)
    
    # 3. Composite Confidence Score Calculation
    # Factors:
    # - OCR Extraction Certainty (weight: 40%)
    # - Catalog Matching Strength (weight: 40%)
    # - Rules conformity (weight: 20%)
    
    ocr_weight = 0.40
    fuzzy_weight = 0.40
    rules_weight = 0.20
    
    rules_score = 1.0
    if not safety_report["safe"]:
        # Safety rules breached reduces confidence
        rules_score = 0.40
    elif safety_report["review_needed"]:
        # Format warnings minor drop
        rules_score = 0.80
        
    composite_score = (ocr_confidence * ocr_weight) + (fuzzy_match_score * fuzzy_weight) + (rules_score * rules_weight)
    
    # Cap between 0.0 and 1.0
    composite_score = max(0.0, min(1.0, float(composite_score)))
    
    # Needs human review if confidence is less than 70% or rules engine requested review
    needs_review = (composite_score < 0.70) or safety_report["review_needed"]
    
    return {
        "name": corrected_name,
        "originalName": raw_name,
        "isValid": is_valid_drug,
        "confidence": round(composite_score, 3),
        "similarity": round(fuzzy_match_score * 100, 1),
        "dosage": dosage or "N/A",
        "frequency": frequency or "N/A",
        "safety": {
            "safe": safety_report["safe"],
            "warnings": safety_report["warnings"],
            "review_needed": needs_review
        }
    }
