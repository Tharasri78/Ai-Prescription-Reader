import re

def correct_text(text):
    text = text.lower()

    corrections = {
        "0": "o",
        "1": "l",
        "|": "l",
        "@": "a",
        "$": "s",
        "5": "s"
    }

    for wrong, right in corrections.items():
        text = text.replace(wrong, right)

    # fix spacing issues
    text = re.sub(r'\s+', ' ', text)

    return text