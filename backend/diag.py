import os
import sys
import traceback

print("--- DIAGNOSTIC START ---")
print(f"Python: {sys.version}")
print(f"CWD: {os.getcwd()}")

# 1. Check Pytesseract
print("\n[1] Checking Pytesseract...")
try:
    import pytesseract
    print(f"Pytesseract imported. Cmd: {pytesseract.pytesseract.tesseract_cmd}")
    try:
        ver = pytesseract.get_tesseract_version()
        print(f"Tesseract Version: {ver}")
    except Exception as e:
        print(f"Tesseract Version Error: {e}")
        # Try common path
        tess_exe = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(tess_exe):
            print(f"Found Tesseract at {tess_exe}")
        else:
            print(f"Tesseract NOT FOUND at {tess_exe}")
except ImportError:
    print("Pytesseract not installed.")

# 2. Check Magic
print("\n[2] Checking Magic...")
try:
    import magic
    print("Magic imported.")
    try:
        m = magic.Magic()
        print("Magic backend initialized successfully.")
    except Exception as e:
        print(f"Magic Initialization Error: {e}")
        traceback.print_exc()
except ImportError:
    print("Magic not installed.")
except Exception as e:
    print(f"Magic Import/Load Error: {e}")
    traceback.print_exc()

# 3. Check EasyOCR
print("\n[3] Checking EasyOCR...")
try:
    import easyocr
    print("EasyOCR imported.")
except ImportError:
    print("EasyOCR not installed.")

print("\n--- DIAGNOSTIC END ---")
