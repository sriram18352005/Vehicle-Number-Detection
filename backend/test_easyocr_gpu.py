import easyocr
import sys
import traceback

print("Starting EasyOCR GPU test...", flush=True)

try:
    print("Initializing Reader with ['en'] and gpu=True (default)...", flush=True)
    reader = easyocr.Reader(['en'], gpu=True)
    print(f"Reader initialized! Using GPU: {reader.gpu}", flush=True)
    
    import numpy as np
    img_array = np.zeros((100, 100, 3), dtype=np.uint8) + 255
    print("Running readtext...", flush=True)
    result = reader.readtext(img_array)
    print(f"Readtext result: {result}", flush=True)
    
except Exception as e:
    print(f"FAILED with exception: {e}", flush=True)
    traceback.print_exc()
    sys.exit(1)

print("Test completed successfully.", flush=True)
