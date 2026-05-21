import re

# Comprehensive curated database of clinical drug-drug interactions
DRUG_INTERACTIONS = [
    {
        "drugs": {"aspirin", "warfarin"},
        "severity": "severe",
        "mechanism": "Synergistic pharmacological effect: both drugs inhibit clotting via different mechanisms.",
        "effects": "Significantly increased risk of severe internal, gastrointestinal, and systemic bleeding.",
        "advice": "Avoid combination. Seek alternative non-NSAID analgesics and monitor INR closely."
    },
    {
        "drugs": {"ibuprofen", "aspirin"},
        "severity": "moderate",
        "mechanism": "Pharmacodynamic competition: ibuprofen blocks aspirin binding to platelet COX-1 receptors.",
        "effects": "Decreased cardioprotective antiplatelet effect of aspirin and elevated risk of gastric ulcers.",
        "advice": "Take aspirin at least 2 hours before or 8 hours after ibuprofen. Monitor for GI discomfort."
    },
    {
        "drugs": {"paracetamol", "alcohol"},
        "severity": "moderate",
        "mechanism": "Enzyme induction: alcohol induces CYP2E1, producing toxic NAPQI metabolite from paracetamol.",
        "effects": "Severe hepatotoxicity (liver damage) even at normal paracetamol therapeutic doses.",
        "advice": "Strictly avoid alcohol consumption while taking paracetamol or acetaminophen products."
    },
    {
        "drugs": {"sildenafil", "nitroglycerin"},
        "severity": "severe",
        "mechanism": "Synergistic vasodilation: accumulation of cyclic GMP causes severe smooth muscle relaxation.",
        "effects": "Acute, life-threatening hypotension (extreme drop in blood pressure) and myocardial infarction.",
        "advice": "Strictly contraindicated. Do not administer nitrates within 24-48 hours of PDE5 inhibitors."
    },
    {
        "drugs": {"azithromycin", "amiodarone"},
        "severity": "severe",
        "mechanism": "Additive cardiac effect: both drugs delay ventricular repolarization.",
        "effects": "Increased risk of QT prolongation and life-threatening arrhythmias (Torsades de Pointes).",
        "advice": "Avoid co-administration. Monitor ECG if combination is medically unavoidable."
    },
    {
        "drugs": {"pantoprazole", "ketoconazole"},
        "severity": "moderate",
        "mechanism": "pH-dependent absorption reduction: pantoprazole increases gastric pH.",
        "effects": "Substantially reduced bioavailability and therapeutic failure of ketoconazole.",
        "advice": "Administer ketoconazole with an acidic beverage (like cola) or space dose at least 12 hours apart."
    },
    {
        "drugs": {"amoxicillin", "methotrexate"},
        "severity": "moderate",
        "mechanism": "Renal clearance competition: penicillin decreases methotrexate excretion in kidneys.",
        "effects": "Elevated methotrexate serum levels, leading to severe bone marrow suppression and GI toxicity.",
        "advice": "Monitor methotrexate blood levels closely. Adjust doses or choose alternative antibiotics."
    }
]

def check_drug_interactions(medicines_list: list[dict]) -> list[dict]:
    """
    Checks a list of medicines for unsafe drug-drug interactions.
    Each medicine dict must have at least a 'name' key.
    Returns a list of triggered warning dictionaries.
    """
    warnings = []
    
    if not medicines_list or len(medicines_list) < 2:
        return warnings
        
    # Extract and clean active names for match comparison
    cleaned_meds = []
    for med in medicines_list:
        name = med.get("name") or ""
        if not name:
            continue
            
        # Standardize: lowercase, strip, remove trailing strength info
        name_clean = name.lower().strip()
        # Remove common numbers or milligram text to isolate generic name
        name_clean = re.sub(r'\b\d+(?:mg|ml|mcg|g)\b', '', name_clean).strip()
        # Remove brand form prefixes/suffixes
        name_clean = re.sub(r'\b(?:tab|cap|inj|syp|tablet|capsule|syrup)\b', '', name_clean).strip()
        
        cleaned_meds.append({
            "original_name": name,
            "normalized_name": name_clean,
            "ref_dict": med
        })
        
    # Double loop to find pairwise overlap
    triggered_pairs = set()
    for i in range(len(cleaned_meds)):
        for j in range(i + 1, len(cleaned_meds)):
            med_a = cleaned_meds[i]
            med_b = cleaned_meds[j]
            
            # Check interaction database
            for interaction in DRUG_INTERACTIONS:
                drugs = interaction["drugs"]
                
                # Check if both drugs in the pair match the normalized names
                match_a = False
                match_b = False
                
                for drug in drugs:
                    if drug in med_a["normalized_name"]:
                        match_a = True
                    elif drug in med_b["normalized_name"]:
                        match_b = True
                        
                # Check cross matching
                if not (match_a and match_b):
                    # Check the inverse just in case
                    match_a_inv = False
                    match_b_inv = False
                    for drug in drugs:
                        if drug in med_b["normalized_name"]:
                            match_a_inv = True
                        elif drug in med_a["normalized_name"]:
                            match_b_inv = True
                    if match_a_inv and match_b_inv:
                        match_a = True
                        match_b = True
                        
                if match_a and match_b:
                    # Create a unique key for the pair to avoid duplicate triggers
                    pair_key = tuple(sorted([med_a["original_name"], med_b["original_name"]]))
                    if pair_key not in triggered_pairs:
                        triggered_pairs.add(pair_key)
                        warnings.append({
                            "med_a": med_a["original_name"],
                            "med_b": med_b["original_name"],
                            "severity": interaction["severity"],
                            "mechanism": interaction["mechanism"],
                            "effects": interaction["effects"],
                            "advice": interaction["advice"]
                        })
                        
    return warnings
