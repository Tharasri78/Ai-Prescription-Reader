import cv2
import numpy as np
from PIL import Image
import io

def preprocess_image(image_bytes: bytes) -> tuple[bytes, dict]:
    """
    Enhances handwritten prescriptions using OpenCV.
    Returns the preprocessed image bytes and a metadata dict detailing the transformations.
    """
    metadata = {
        "grayscaled": False,
        "contrast_enhanced": False,
        "noise_reduced": False,
        "binarized": False,
        "deskewed": False,
        "skew_angle": 0.0,
        "version": "v1.2-clahe",
        "error": None
    }
    
    try:
        # 1. Decode image from bytes
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image from bytes. Unsupported format or corrupted file.")
        
        # Keep track of transformations
        h, w = img.shape[:2]
        
        # 2. Convert to Grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        metadata["grayscaled"] = True
        
        # 3. Contrast Enhancement (CLAHE - Contrast Limited Adaptive Histogram Equalization)
        # Highly effective for uneven illumination, shadows, and faded ink.
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        metadata["contrast_enhanced"] = True
        
        # 4. Noise Reduction (Gaussian Blur to smooth out scanning grain and texture)
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        metadata["noise_reduced"] = True
        
        # 5. Deskewing
        # Detect handwriting orientation angle using minimal bounding boxes of text regions
        # Threshold the blurred image to find text blobs
        _, thresh_temp = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        coords = np.column_stack(np.where(thresh_temp > 0))
        angle = 0.0
        
        if len(coords) > 0:
            # minAreaRect returns ((center_x, center_y), (width, height), angle_of_rotation)
            rect = cv2.minAreaRect(coords)
            angle = rect[-1]
            
            # Correct the angle according to OpenCV conventions
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            
            # Apply deskew rotation if skew is meaningful but not extreme (e.g. up to 45 deg)
            if 0.5 <= abs(angle) <= 45.0:
                center = (w // 2, h // 2)
                rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
                blurred = cv2.warpAffine(blurred, rotation_matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                enhanced = cv2.warpAffine(enhanced, rotation_matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                metadata["deskewed"] = True
                metadata["skew_angle"] = round(float(angle), 2)
                
        # 6. Binarization (Otsu's Thresholding)
        # Yields a high-contrast black-and-white mask optimal for OCR engines
        _, binarized = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        metadata["binarized"] = True
        
        # 7. Encode image back to JPEG/PNG bytes
        # We will use JPEG with high quality
        success, encoded_img = cv2.imencode(".jpg", binarized, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        if not success:
            raise RuntimeError("Failed to re-encode preprocessed image to bytes.")
            
        return encoded_img.tobytes(), metadata
        
    except Exception as e:
        print(f"[WARN] Preprocessing failed: {repr(e)}. Falling back to original image.")
        metadata["error"] = str(e)
        return image_bytes, metadata
