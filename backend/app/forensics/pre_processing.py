import cv2
import numpy as np
from PIL import Image
import os
import traceback

# Optional dependency: PyMuPDF (fitz)
try:
    import fitz
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False
    print("CRITICAL WARNING: PyMuPDF (fitz) not found. PDF conversion will fail.")

def preprocess_image(image_path: str) -> str:
    """
    Cleans the image before analysis:
    - Converts PDF to Image if necessary
    - Noise reduction
    - Skew correction
    - Contrast normalization
    """
    # 0. Handle PDF to Image conversion
    ext = os.path.splitext(image_path)[1].lower()
    work_path = image_path
    
    if ext == ".pdf":
        print(f"PREPROCESS: Converting PDF {image_path} to Image...")
        if not HAS_FITZ:
            raise ImportError("PyMuPDF (fitz) is required for PDF to Image conversion. Please install it.")
        
        try:
            doc = fitz.open(image_path)
            page = doc.load_page(0)  # first page
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # upscale 2x for better OCR
            
            # Save temporary image
            img_path = image_path.replace(".pdf", "_preview.png")
            pix.save(img_path)
            work_path = img_path
            doc.close()
        except Exception as e:
            print(f"PDF to Image error: {traceback.format_exc()}")
            raise e
    
    print(f"PREPROCESS: Loading image {work_path}...")
    # 1. Load Image
    img = cv2.imread(work_path)
    if img is None:
        return work_path
        
    # 2. Resize if too massive (prevent CPU thrashing)
    h, w = img.shape[:2]
    max_dim = 2500
    if max(h, w) > max_dim:
        print(f"PREPROCESS: Resizing large image ({w}x{h})...")
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
        
    print("PREPROCESS: Enhancing contrast and denoising...")
    # 3. Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 4. Denoise (Fast)
    # Using Gaussian blur as it's faster than fastNlMeansDenoising for large images
    denoised = cv2.GaussianBlur(gray, (3, 3), 0)
    
    # 5. Contrast Enhancement (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)
    
    # Save processed image back
    processed_path = work_path.replace(ext, "_processed.png") if ext != ".pdf" else work_path
    print(f"PREPROCESS: Saving result to {processed_path}")
    cv2.imwrite(processed_path, enhanced)
    
    return processed_path
