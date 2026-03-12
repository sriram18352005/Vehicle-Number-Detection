import easyocr
import sys
import traceback

print("Starting EasyOCR test...", flush=True)

try:
    print("Initializing Reader with ['en'] and gpu=False...", flush=True)
    # This might try to download models to ~/.EasyOCR/model
    reader = easyocr.Reader(['en'], gpu=False)
    print("Reader initialized successfully!", flush=True)
    
    import numpy as np
    from PIL import Image
    
    # Create a small blank image
    img_array = np.zeros((100, 100, 3), dtype=np.uint8) + 255
    print("Running readtext on blank image...", flush=True)
    result = reader.readtext(img_array)
    print(f"Readtext result: {result}", flush=True)
    
except Exception as e:
    print(f"FAILED with exception: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

print("Test completed successfully.", flush=True)
