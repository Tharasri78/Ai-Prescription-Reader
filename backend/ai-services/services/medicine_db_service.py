import json
import os

DB_PATH = "services/medicine_db.json"


def load_medicines():
    if not os.path.exists(DB_PATH):
        return []

    with open(DB_PATH, "r") as f:
        return json.load(f)


def save_medicine(name):
    meds = load_medicines()

    if name.lower() not in meds:
        meds.append(name.lower())

        with open(DB_PATH, "w") as f:
            json.dump(meds, f, indent=2)