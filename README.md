#  AI Powered Code Assistant

An advanced AI-powered Code Assistant that helps developers write, debug, analyze, and understand code using LLMs, RAG, and sandbox execution.

---

##  Overview

This project is a full-stack AI assistant that acts like a mini ChatGPT for developers.

It can:
-  Generate code from prompts
-  Debug and fix errors
-  Explain code in simple language
-  Analyze uploaded files (PDF, DOCX, code)
-  Use RAG (Retrieval-Augmented Generation)
-  Run Python code safely in a sandbox
-  Maintain chat history

---

##  Features

- AI Chat Assistant (LangChain + OpenAI)
- Code Analysis Engine
- Debugging Assistant (auto-fix suggestions)
- RAG-based document understanding
- Multi-chat system with memory
- Python code execution sandbox
- File upload support (PDF, DOCX, Code files)

---

##  Tech Stack

**Frontend:**
- React.js
- HTML, CSS, JavaScript

**Backend:**
- Flask (Python)
- SQLite (Database)

**AI / ML:**
- OpenAI API
- LangChain
- ChromaDB (Vector Database)

**Others:**
- Python-dotenv
- PyPDF
- docx2txt
- Requests

---

##  Project Structure
AI-Assistant-Pro/
│
├── backend/
│ ├── app.py
│ ├── langchain_client.py
│ ├── rag_engine.py
│ ├── sandbox.py
│ ├── db.py
│
├── frontend/
│ ├── src/
│ ├── public/
│
├── requirements.txt
├── README.md




---

##  Environment Variables

Create `.env` file in backend:

```env
OPENAI_API_KEY=your_api_key_here



## How to Run Project
1️⃣ Clone Repo
git clone https://github.com/divy686/ai-code-assistant.git
cd ai-code-assistant

2️⃣ Backend Setup
cd backend
pip install -r requirements.txt
python app.py


3️⃣ Frontend Setup
cd frontend
npm install
npm start


## Screenshots




