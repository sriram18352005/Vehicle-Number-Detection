import sys
import os
import time

# Add backend to path for imports
sys.path.append(os.path.abspath("backend"))

from app.forensics.ocr_pipeline import perform_ocr

test_file = r"C:\Users\vvsri\OneDrive\Desktop\al authenticator2\backend\storage\uploads\016fe6ee-681c-4f40-b206-a128038bbffa.jpeg"

if os.path.exists(test_file):
    print(f"Testing OCR on: {test_file}")
    start_time = time.time()
    try:
        results = perform_ocr(test_file)
        end_time = time.time()
        print(f"OCR finished in {end_time - start_time:.2f} seconds")
        print(f"Document Type: {results.get('document_type')}")
        print(f"Confidence: {results.get('confidence')}")
        print(f"Text Snippet: {results.get('text')[:100]}...")
    except Exception as e:
        print(f"OCR FAILED with error: {e}")
else:
    print(f"Test file NOT FOUND: {test_file}")
