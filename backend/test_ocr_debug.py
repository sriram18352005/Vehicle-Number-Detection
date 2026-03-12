import easyocr
import pytesseract
from PIL import Image
import os
import sys
import traceback

def test_ocr():
    image_path = "test_image.png" # We need a dummy image
    # Create a dummy image with some text if not exists
    if not os.path.exists(image_path):
        from PIL import ImageDraw
        img = Image.new('RGB', (200, 100), color = (255, 255, 255))
        d = ImageDraw.Draw(img)
        d.text((10,10), "Hello World 123456789012", fill=(0,0,0))
        img.save(image_path)

    print("--- Testing EasyOCR ---")
    try:
        reader = easyocr.Reader(['en'], gpu=False)
        results = reader.readtext(image_path)
        print(f"EasyOCR Result: {results}")
    except Exception:
        print("EasyOCR Failed:")
        traceback.print_exc()

    print("\n--- Testing Tesseract ---")
    try:
        tess_exe = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(tess_exe):
            pytesseract.pytesseract.tesseract_cmd = tess_exe
            print(f"Using Tesseract at: {tess_exe}")
        
        version = pytesseract.get_tesseract_version()
        print(f"Tesseract Version: {version}")
        text = pytesseract.image_to_string(Image.open(image_path)).strip()
        print(f"Tesseract Result: '{text}'")
    except Exception:
        print("Tesseract Failed:")
        traceback.print_exc()

if __name__ == "__main__":
    test_ocr()
