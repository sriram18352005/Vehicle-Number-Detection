import sys
import os
sys.path.append(os.getcwd())

from app.forensics.ocr_pipeline import get_ocr_reader

TEST_FILE = "storage/uploads/d8cf6548-cbed-4ae6-82a2-e1293859348f.jpeg"

print(f"Testing EasyOCR structure on {TEST_FILE}...")
reader = get_ocr_reader()
results = reader.readtext(TEST_FILE)

print(f"\nNumber of results: {len(results)}")
for i, res in enumerate(results):
    print(f"\nResult {i}:")
    print(f"  Type: {type(res)}")
    print(f"  Length: {len(res)}")
    print(f"  Content: {res}")
    if len(res) >= 3:
        print(f"  res[0] (bbox): {res[0]} (type: {type(res[0])})")
        print(f"  res[1] (text): {res[1]} (type: {type(res[1])})")
        print(f"  res[2] (conf): {res[2]} (type: {type(res[2])})")
