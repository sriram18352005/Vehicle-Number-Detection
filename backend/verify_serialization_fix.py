import numpy as np
import json
import sys
import os

# Add the current directory to the path so we can import app
sys.path.append(os.getcwd())

from app.core.json_utils import numpy_to_python

def test_serialization():
    print("Testing NumPy to Python conversion...")
    
    test_data = {
        "an_int32": np.int32(123),
        "a_float64": np.float64(45.67),
        "an_array": np.array([1, 2, 3], dtype=np.int32),
        "a_nested_dict": {
            "inner_int": np.int64(999),
            "inner_list": [np.float32(1.1), np.float32(2.2)]
        },
        "a_bool": np.bool_(True)
    }
    
    # 1. Verify standard json.dumps fails without conversion
    try:
        json.dumps(test_data)
        print("FAILED: json.dumps should have failed without conversion but it passed.")
        return False
    except TypeError as e:
        print(f"SUCCESS (expected): standard json.dumps failed with: {e}")
        
    # 2. Verify numpy_to_python conversion
    converted_data = numpy_to_python(test_data)
    
    # 3. Verify standard json.dumps passes WITH conversion
    try:
        json_output = json.dumps(converted_data)
        print("SUCCESS: json.dumps passed after conversion!")
        print(f"JSON Output: {json_output}")
    except TypeError as e:
        print(f"FAILED: json.dumps failed even after conversion! Error: {e}")
        return False
        
    # 4. Deep check of types
    assert isinstance(converted_data["an_int32"], int)
    assert isinstance(converted_data["a_float64"], float)
    assert isinstance(converted_data["an_array"], list)
    assert isinstance(converted_data["an_array"][0], int)
    assert isinstance(converted_data["a_nested_dict"]["inner_int"], int)
    assert isinstance(converted_data["a_bool"], bool)
    
    print("All type checks passed!")
    return True

if __name__ == "__main__":
    if test_serialization():
        print("\nFix Verified Successfully!")
        sys.exit(0)
    else:
        print("\nFix Verification Failed!")
        sys.exit(1)
