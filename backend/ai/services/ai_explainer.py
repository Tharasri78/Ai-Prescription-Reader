import difflib
import pandas as pd
import os

def explain_medicines(meds: list):
    if not os.path.exists("medicines.csv"):
        print("⚠️ medicines.csv not found, skipping explanations")
        return meds

    df = pd.read_csv("medicines.csv")
    known_names = df["name"].tolist()

    explained = []
    for med in meds:
        corrected_name = difflib.get_close_matches(med["name"], known_names, n=1, cutoff=0.7)
        name = corrected_name[0] if corrected_name else med["name"]
        match = df[df["name"].str.lower() == name.lower()]
        explanation = match["explanation"].values[0] if not match.empty else "No explanation available"

        explained.append({
            "name": name,
            "dose": med["dose"],
            "frequency": med["frequency"],
            "duration": med.get("duration", ""),
            "explanation": explanation
        })
    return explained