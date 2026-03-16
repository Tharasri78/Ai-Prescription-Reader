import os

def save_uploaded_file(upload, upload_dir="uploads"):
    """Save uploaded file to disk and return path."""
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, upload.filename)
    with open(file_path, "wb") as f:
        f.write(upload.file.read())
    return file_path