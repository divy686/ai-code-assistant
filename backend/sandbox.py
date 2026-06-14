import subprocess
import tempfile
import os
import pygments.lexers

def run_code_snippet(code: str):
    
    
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".py", mode="w", encoding="utf-8") as f:
        f.write(code)
        temp_path = f.name

    try:
        
        result = subprocess.run(
            ["python", temp_path],
            capture_output=True,
            text=True,
            timeout=10,
            shell=False  
        )

        return result.stdout, result.stderr

    except subprocess.TimeoutExpired:
        return "", "Error: Execution timed out (10s limit)."
    except Exception as e:
        return "", str(e)

    finally:
        
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def detect_language(code: str) -> str:
    
    if not code.strip():
        return "empty"
    try:
        lexer = pygments.lexers.guess_lexer(code)
        name = lexer.name.lower()
        return name if name != "text" else "plaintext"
    except Exception:
        return "unknown"
