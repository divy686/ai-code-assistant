from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_client import LangChainClient
from sandbox import run_code_snippet
from rag_engine import RAGEngine
from db import init_db, save_message, get_messages, clear_messages, get_all_chats, create_chat, update_chat_title
import os, tempfile, time
from pypdf import PdfReader
from docx2txt import process as docx_process
from dotenv import load_dotenv

load_dotenv()  
app = Flask(__name__)
CORS(app)

init_db()
ai_assistant = LangChainClient()
rag_engine = RAGEngine() 

# --- Helper: File Extraction ---
def extract_text(file):
    suffix = os.path.splitext(file.filename)[-1].lower()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name
        
        text = ""
        if suffix == ".pdf":
            reader = PdfReader(tmp_path)
            text = "\n".join([p.extract_text() for p in reader.pages if p.extract_text()])
        elif suffix == ".docx":
            text = docx_process(tmp_path)
        elif suffix in [".py", ".js", ".ts", ".java", ".cpp", ".c", ".html", ".css", ".json", ".go", ".rb", ".php", ".cs", ".txt", ".md"]:
            with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        return text or ""
    except Exception as e:
        print(f"Error reading {file.filename}: {e}")
        return ""

# --- ROUTES ---

@app.route('/create-chat', methods=['POST'])
def create_chat_route():
    try:
        data = request.json or {}
        chat_id = data.get("chat_id")
        if not chat_id:
            return jsonify({"error": "chat_id required"}), 400
        create_chat(chat_id, title="New Discussion 💬")
        return jsonify({"status": "created"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        files = request.files.getlist('files')
        chat_id = request.form.get("chat_id")
        
        if not files:
            return jsonify({"reply": "❌ No files uploaded."}), 400

        # 🔥 Fix 1: Clear previous context before new analysis
        rag_engine.clear_db()
        time.sleep(1) # Safety for Windows file lock

        for file in files:
            text = extract_text(file)
            if text.strip():
                rag_engine.add_documents(text, file.filename)

        context = rag_engine.search("Review all uploaded code files.")
        
        if not context.strip():
            return jsonify({"reply": "❌ Content extraction failed."}), 400

        ai_assistant.set_mode("Code Analysis")

        prompt = f"""
You are a Senior Software Engineer and Code Reviewer. 
Analyze ALL uploaded files separately and follow STRICT formatting for EACH file:

--------------------------------------------------
📄 File: [filename]
--------------------------------------------------
🔹 **Summary**: 
(Explain what this file does in 2-3 lines)

🔹 **Issues / Improvements**: 
- (List clear bullet points for bugs or bad practices)

🔹 **Suggested Fix**: 
- (Provide improved code snippet ONLY if necessary)

🔹 **Code Quality Score**: [X/10]
--------------------------------------------------

RULES:
- DO NOT merge multiple files.
- ALWAYS use bullet points (no long paragraphs).
- Mention if this file depends on or calls another uploaded file.
- Keep the response professional and concise.
- If the uploaded file is not source code, provide a professional document summary, key points, and suggestions.
Context: 
{context}
"""

        
           
        
        response = ai_assistant.chat([{"role": "user", "content": prompt}])

        # 🔥 Fix 2: Dynamic Sidebar Title
        if chat_id and len(files) > 0:
            try:
                update_chat_title(chat_id, f"📄 Analysis: {files[0].filename}")
            except: pass

        return jsonify({"reply": response})

    except Exception as e:
        return jsonify({"reply": f"❌ Analysis Error: {str(e)}"}), 500

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json or {}
        chat_id = data.get("chat_id")
        user_input = data.get("message")
        history = data.get("history", [])

        if not chat_id:
            return jsonify({"status": "error", "message": "Missing chat_id"}), 400

        # Title update for first message
        existing_msgs = get_messages(chat_id)
        if len(existing_msgs) == 0 and user_input:
            update_chat_title(chat_id, user_input)

        ai_assistant.set_mode(data.get("mode", "General"))
        
        if user_input:
            save_message(chat_id, "user", user_input)

        response = ai_assistant.chat(history)
        save_message(chat_id, "assistant", response)
        
        return jsonify({"status": "success", "reply": response})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/chats', methods=['GET'])
def chats_list():
    return jsonify({"chats": get_all_chats()})

@app.route('/history/<chat_id>', methods=['GET'])
def history(chat_id):
    return jsonify({"messages": get_messages(chat_id)})

@app.route('/clear-history/<chat_id>', methods=['POST'])
def clear_single_chat(chat_id):
    clear_messages(chat_id)
    return jsonify({"status": "cleared"})

@app.route('/run-python', methods=['POST'])
def run_python():
    try:
        data = request.json
        code = data.get("code", "")
        stdout, stderr = run_code_snippet(code)
        if stderr:
            ai_assistant.set_mode("Debugger")
            fixed = ai_assistant.chat([{"role": "user", "content": f"Fix: {stderr}\nCode: {code}"}])
            return jsonify({"status": "auto-fixed", "error": stderr, "fixed_code": fixed, "output": stdout})
        return jsonify({"status": "success", "output": stdout})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=8080)
