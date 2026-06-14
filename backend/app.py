from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_client import LangChainClient
from sandbox import run_code_snippet
from rag_engine import RAGEngine

import os, tempfile
from pypdf import PdfReader
from docx2txt import process as docx_process
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

ai_assistant = LangChainClient()
rag = RAGEngine()

# --- Helper Function to Read Any File ---
def extract_text(file):
    suffix = os.path.splitext(file.filename)[-1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        if suffix == ".pdf":
            reader = PdfReader(tmp_path)
            return "\n".join([
                page.extract_text() for page in reader.pages if page.extract_text()
            ]) or ""

        elif suffix == ".docx":
            return docx_process(tmp_path) or ""

        else:
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read() or ""

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# 💬 CHAT ROUTE
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        ai_assistant.set_mode(data.get("mode", "General"))

        # ✅ FIX: no duplicate message
        response = ai_assistant.chat(data.get("history", []))

        return jsonify({"status": "success", "reply": response})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# 🚀 RUN PYTHON CODE
@app.route('/run-python', methods=['POST'])
def run_python():
    try:
        data = request.json
        stdout, stderr = run_code_snippet(data.get("code"))

        if stderr:
            ai_assistant.set_mode("Debugger")

            prompt = f"""
Fix this Python error:
{stderr}

Code:
{data.get('code')}

Return ONLY fixed code.
"""

            fixed = ai_assistant.chat([{"role": "user", "content": prompt}])

            return jsonify({
                "status": "auto-fixed",
                "error": stderr,
                "fixed_code": fixed,
                "output": stdout
            })

        return jsonify({"status": "success", "output": stdout})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# 📊 ANALYZE FILES
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        files = request.files.getlist('files')

        if not files:
            return jsonify({"reply": "❌ No files uploaded."})

        global rag
        rag = RAGEngine()

        for file in files:
            text = extract_text(file) or ""
            if text.strip():
             rag.add_documents(text, file.filename)

        context = rag.search("Analyze all uploaded files separately. Mention every file name and its issues clearly.")

        if not context.strip():
            return jsonify({"reply": "❌ Could not extract useful content."})

        ai_assistant.set_mode(request.form.get('mode', 'General'))

        prompt = f"""
You are a strict senior code reviewer.

Analyze ALL uploaded files using the context.

IMPORTANT:
- You MUST mention every file present in the context
- Do NOT skip any file
- Do NOT assume anything
- Only use given context

Context:
{context}

Output format:

1. Summary
2. File-wise Errors (for EACH file)
3. File-wise Improvements (for EACH file)
4. Code Quality Score (out of 10)
"""

        response = ai_assistant.chat([{"role": "user", "content": prompt}])

        return jsonify({"reply": response})

    except Exception as e:
        return jsonify({"reply": f"❌ Error: {str(e)}"})

# ▶️ RUN APP
if __name__ == '__main__':
    app.run(debug=True, port=8080)