import sys
import os
import time
import asyncio
import contextvars
import functools

# Add backend to path for imports
sys.path.append(os.path.abspath("backend"))

from app.forensics.symbols import detect_symbols
from app.forensics.metadata_extractor import extract_metadata
from app.forensics.forensic_suite import ForensicSuite

# Compatibility for Python < 3.9
async def to_thread(func, /, *args, **kwargs):
    loop = asyncio.get_running_loop()
    ctx = contextvars.copy_context()
    func_call = functools.partial(ctx.run, func, *args, **kwargs)
    return await loop.run_in_executor(None, func_call)

test_file = r"C:\Users\vvsri\OneDrive\Desktop\al authenticator2\backend\storage\uploads\016fe6ee-681c-4f40-b206-a128038bbffa.jpeg"

async def test_stage2():
    if os.path.exists(test_file):
        print(f"Testing Stage 2 on: {test_file}")
        start_time = time.time()
        
        # Simulate the worker's parallel execution
        print("Starting parallel tasks...")
        symbol_task = to_thread(detect_symbols, test_file)
        meta_task = to_thread(extract_metadata, test_file)
        forensic_suite = ForensicSuite()
        suite_task = to_thread(forensic_suite.run_all, test_file)

        results = await asyncio.gather(symbol_task, meta_task, suite_task)
        end_time = time.time()
        
        print(f"Stage 2 finished in {end_time - start_time:.2f} seconds")
        print(f"Symbols detected: {len(results[0])}")
        print(f"Forensic status: {results[2].get('status')}")
    else:
        print(f"Test file NOT FOUND: {test_file}")

if __name__ == "__main__":
    asyncio.run(test_stage2())
