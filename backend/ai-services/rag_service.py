import os
import json
from rapidfuzz import process, fuzz
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# Load local medical database
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "data", "medical_database.json")

def load_medical_db():
    try:
        if os.path.exists(DATABASE_PATH):
            with open(DATABASE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"❌ Failed to load medical database: {repr(e)}")
    return []

MEDICAL_DB = load_medical_db()

def search_medicine_details(query: str) -> dict | None:
    """
    Performs high-speed fuzzy search on local medicine database.
    Returns the matching record or None.
    """
    if not query or not MEDICAL_DB:
        return None
        
    query_clean = query.strip().lower()
    
    # Extract lists of medicine names from DB
    db_medicines = [item["medicine"].lower() for item in MEDICAL_DB]
    
    # Run rapidfuzz to find the best match
    # process.extractOne returns: (matched_string, similarity_score, index)
    match_result = process.extractOne(query_clean, db_medicines, scorer=fuzz.WRatio)
    
    if match_result:
        matched_str, score, idx = match_result
        if score > 60.0:  # Matching threshold
            return MEDICAL_DB[idx]
            
    return None

def retrieve_grounded_medicine_guide(med_name: str) -> dict:
    """
    Retrieves drug-related facts from local database, then calls Gemini 
    to write a clean patient summary, grounding the response with source attribution.
    """
    default_payload = {
        "medicine": med_name,
        "activeIngredient": "Unknown",
        "summary": "No verified medical data found in local repository. Consult a doctor.",
        "sideEffects": "Unknown",
        "precautions": "Unknown",
        "source": "None"
    }
    
    record = search_medicine_details(med_name)
    
    if not record:
        return default_payload
        
    # Standard medical context to supply to Gemini
    context = f"""
    Medicine: {record['medicine']}
    Active Ingredient: {record['activeIngredient']}
    Clinical Usages: {record['usages']}
    Side Effects: {record['sideEffects']}
    Precautions & Guidelines: {record['precautions']}
    Reference Database Source: {record['source']}
    """
    
    prompt = f"""
    You are an expert clinical pharmacist explaining a medication to a patient in a simple, friendly, and completely truthful manner.
    Based strictly on the verified clinical facts below, write a short, patient-friendly summary (maximum 3 sentences) summarizing what it is and how to use it safely.
    
    FACTS:
    {context}
    
    Rules:
    - Never add any unverified side effects or clinical guidelines not found in the facts (no hallucinations).
    - If there are strict precautions (like avoiding alcohol), mention them explicitly.
    - End your summary with an explicit source attribution sentence: "Source: [Insert Reference Database Source here]".
    """
    
    try:
        response = model.generate_content(prompt)
        summary_text = getattr(response, "text", None)
        
        if not summary_text:
            summary_text = f"Used for: {record['usages']}. Source: {record['source']}"
            
        return {
            "medicine": record["medicine"],
            "activeIngredient": record["activeIngredient"],
            "summary": summary_text.strip(),
            "sideEffects": record["sideEffects"],
            "precautions": record["precautions"],
            "source": record["source"]
        }
        
    except Exception as e:
        print(f"❌ RAG Gemini call failed: {repr(e)}")
        # Graceful fallback to raw record properties
        return {
            "medicine": record["medicine"],
            "activeIngredient": record["activeIngredient"],
            "summary": f"Commonly used to treat {record['usages']}. Source: {record['source']}",
            "sideEffects": record["sideEffects"],
            "precautions": record["precautions"],
            "source": record["source"]
        }
