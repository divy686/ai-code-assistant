import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('General');                  
  const [activeTab, setActiveTab] = useState('chatTab');            
  const [files, setFiles] = useState([]);
  const [analysisResult, setAnalysisResult] = useState('Results will appear here...');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null); 
  const isFirstLoad = useRef(true);               

  useEffect(() => {   
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });              
  }, [messages]);

  // 🔥 Chat History Load
useEffect(() => {
  const savedMessages = localStorage.getItem("chatHistory");
  if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
  }
}, []);

// 🔥 Chat History Save
useEffect(() => {
  if (isFirstLoad.current) {
    isFirstLoad.current = false;
    return;
  }

  localStorage.setItem("chatHistory", JSON.stringify(messages));
}, [messages]);

  // 💬 Chat Function
  const sendMessage = async () => {
  if (!input.trim()) return;

  const userMsg = { role: 'user', content: input };

  const updatedMessages = [...messages, userMsg]; // 🔥 fix

  setMessages(updatedMessages);
  setInput('');

  try {
    setLoading(true);

    const res = await axios.post('http://127.0.0.1:8080/chat', {
      message: input,
      history: updatedMessages, // 🔥 same use karo
      mode: mode
    });

    setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);

  } catch (err) {
    console.error(err);
    alert("❌ Backend error!");
  } finally {
    setLoading(false);
  }
};

  // 🚀 Run & Auto-Fix
  const runCode = async () => {
    const lastAIResponse = messages.filter(m => m.role === 'assistant').pop();
    if (!lastAIResponse) return alert("Pehle AI se code generate karwao!");

    const codeMatch = lastAIResponse.content.match(/```(?:python)?([\s\S]*?)```/);

    // ✅ SAFE CHECK
    if (!codeMatch) {
      return alert("⚠️ No runnable code found!");
    }

    const codeToRun = codeMatch[1].trim();

    setAnalysisResult("⏳ Executing code and checking for errors...");
    setActiveTab('analysisTab');

    try {
      setLoading(true); 
      const res = await axios.post('http://127.0.0.1:8080/run-python', {
        code: codeToRun,
        auto_fix: true
      });

      if (res.data.status === 'auto-fixed') {
        setAnalysisResult(
          `## ❌ Error Detected\n\`\`\`\n${res.data.error}\n\`\`\`\n\n` +
          `## 🔧 Auto-Fixed Code\n\`\`\`python\n${res.data.fixed_code}\n\`\`\`\n\n` +
          `## ✅ Output (if any)\n\`\`\`\n${res.data.output || "No output"}\n\`\`\``
        );
      } else {
        setAnalysisResult(
          `## 🖥️ Execution Output\n\`\`\`\n${res.data.output || "No output"}\n\`\`\`\n\n` +
          `${res.data.error ? `**Errors:**\n\`\`\`\n${res.data.error}\n\`\`\`` : ""}`
        );
      }
    } catch (err) {
      console.error(err);
      setAnalysisResult("❌ Error: Execution failed.");
      } finally {
    setLoading(false); 
    }
  };

  // 📂 File Upload
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // 📊 Analyze
  const analyzeFiles = async () => {
    if (files.length === 0) return;

    setAnalysisResult("Analyzing project files...");
    setActiveTab('analysisTab');

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('mode', mode);

    try {
      setLoading(true);
      const res = await axios.post('http://127.0.0.1:8080/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAnalysisResult(res.data.reply);
    } catch (err) {
      console.error(err);
      setAnalysisResult("❌ Backend not running or error occurred");
      } finally {
    setLoading(false);
    }
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="logo">🤖 AI Code Assistant</div>

        <div className="section">
          <label>⚙️ Mode Selection</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option>General</option>
            <option>Code Analysis</option>
            <option>Code Generator</option>
            <option>Debugger</option>
            <option>Code Guide</option>
            <option>Optimization</option>
            <option>Explain Code</option>
            <option>Project Builder</option>
            <option>Documentation</option>
          </select>
        </div>

        <div className="section">
          <label>📂 Upload Project Files</label>
          <input
            type="file"
            multiple
            hidden
            id="fileInput"
            onChange={handleFileChange}
            accept=".py,.js,.ts,.java,.cpp,.c,.html,.css,.json,.go,.rb,.php,.cs,.txt,.md,.docx,.pdf"
          />
          <label htmlFor="fileInput" className="upload-btn"> Browse Files </label>

          <div className="file-list">
            {files.map((f, i) => (
              <div key={i} className="file-item">📄 {f.name}</div>
            ))}
          </div>

          {files.length > 0 && (
    <button 
    onClick={analyzeFiles} 
    disabled={loading} 
    className="primary-btn" 
    style={{ marginTop: '10px', opacity: loading ? 0.6 : 1 }}
  >
              🔍 Run Analysis
            </button>
          )}
        </div>

        <button
          onClick={runCode}
          className="primary-btn"
          disabled={loading}
          style={{ marginTop: '10px', background: '#27ae60' }}
        >
          🚀 Run & Auto-Fix
        </button>

        <button
          onClick={() => {
            setMessages([]);
            setAnalysisResult('Results will appear here...');
            localStorage.removeItem("chatHistory");
          }}
          id="clearBtn"
        >
          🗑️ Clear Chat
        </button>
      </aside>

      <main className="main-content">
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'chatTab' ? 'active' : ''}`}
            onClick={() => setActiveTab('chatTab')}
          >
            💬 Chat
          </button>

          <button
            className={`tab-btn ${activeTab === 'analysisTab' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysisTab')}
          >
            📊 Analysis & Terminal
          </button>
        </div>

        <div className="tab-content active">
          {activeTab === 'chatTab' ? (
            <>
              <div className="chat-window scroll">
                {messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ))}

                {loading && <div className="loading">⏳ Processing...</div>}

                <div ref={chatEndRef} />
              </div>

              <div className="input-box">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    !e.shiftKey &&
                    (e.preventDefault(), sendMessage())
                  }
                  placeholder="Ask to generate, debug, or explain code..."
                />
                <button onClick={sendMessage} id="sendBtn" disabled={loading}>➤</button>
              </div>
            </>
          ) : (
            <div className="analysis-window scroll">
              {loading && <div className="loading">⏳ Processing...</div>}
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;    