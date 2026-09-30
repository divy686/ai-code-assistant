import React, { useState, useEffect, useRef } from 'react'; 
import axios from 'axios'; 
import ReactMarkdown from 'react-markdown'; 
import './App.css'; 
 
const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080";

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
  const [chatId, setChatId] = useState(Date.now().toString()); 
  const [chatList, setChatList] = useState([]);         
 
   
  useEffect(() => { 
    loadChats(); 
  }, []); 
 
  const loadChats = async () => { 
    try { 
      const res = await axios.get(`${API_URL}/chats`); 
      setChatList(res.data.chats || []); 
    } catch { 
      console.log("Error loading chats"); 
    } 
  }; 
 
 
  useEffect(() => { 
    loadHistory(chatId); 
  }, [chatId]); 
 
  const loadHistory = async (id) => { 
    try { 
      const res = await axios.get(`${API_URL}/history/${id}`); 
      setMessages(res.data.messages || []); 
    } catch { 
      console.log("Error loading history"); 
    } 
  }; 
 
   
  const sendMessage = async () => { 
    if (!input.trim()) return; 
 
    const userMsg = { role: 'user', content: input }; 
    const updatedMessages = [...messages, userMsg]; 
 
    setMessages(updatedMessages); 
    setInput(''); 
 
    try { 
      setLoading(true); 
 
      const res = await axios.post(`${API_URL}/chat`, { 
        message: input, 
        history: updatedMessages, 
        mode: mode, 
        chat_id: chatId 
      }); 
 
      setMessages(prev => [ 
        ...prev, 
        { role: 'assistant', content: res.data.reply } 
      ]); 
 
      loadChats();  
 
    } catch (err) { 
      console.error(err); 
      alert("❌ Backend error!"); 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  // 🚀 RUN CODE 
  const runCode = async () => { 
    const lastAIResponse = messages.filter(m => m.role === 'assistant').pop(); 
    if (!lastAIResponse) return alert("Pehle AI se code generate karwao!"); 
 
    const codeMatch = lastAIResponse.content.match(/```(?:python)?([\s\S]*?)```/); 
    if (!codeMatch) return alert("⚠️ No runnable code found!"); 
 
    const codeToRun = codeMatch[1].trim(); 
 
    setAnalysisResult("⏳ Executing..."); 
    setActiveTab('analysisTab'); 
 
    try { 
      setLoading(true); 
 
      const res = await axios.post(`${API_URL}/run-python`, { 
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
 
   
  const handleFileChange = (e) => { 
    setFiles(Array.from(e.target.files)); 
  }; 
 
   
 
 
const analyzeFiles = async () => { 
  if (files.length === 0) return; 
 
  setAnalysisResult("Analyzing project files..."); 
  setActiveTab('analysisTab'); 
 
  try { 
    setLoading(true); 
 
    const formData = new FormData(); 
    files.forEach(f => formData.append('files', f)); 
    formData.append('mode', mode); 
    formData.append('chat_id', chatId); 
 
    const res = await axios.post(`${API_URL}/analyze`, formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    }); 
 
    setAnalysisResult(""); 
    setTimeout(() => { 
      setAnalysisResult(res.data.reply); 
    }, 100); 
 
    setFiles([]); 
    document.getElementById("fileInput").value = ""; 
    loadChats(); 
 
  } catch (err) { 
    console.error(err); 
    setAnalysisResult("❌ Backend not running or error occurred"); 
  } finally { 
    setLoading(false); 
  } 
}; 
 
  const loadChatMessages = async (id) => { 
  try { 
    setChatId(id); 
    const res = await axios.get(`${API_URL}/history/${id}`); 
    setMessages(res.data.messages || []); 
  } catch (err) { 
    console.log("Error loading chat messages"); 
  } 
}; 
 
   
const clearChat = async () => { 
  try { 
    await axios.post(`${API_URL}/clear-history/${chatId}`); 
    setMessages([]); 
    setAnalysisResult('Results will appear here...'); 
  } catch (err) { 
    console.log("Error clearing chat"); 
  } 
}; 
 
  return ( 
    <div className="container"> 
      <aside className="sidebar"> 
        <div className="logo">🤖 AI Code Assistant</div> 
         
   
<button onClick={async () => { 
    const newId = Date.now().toString(); 
    try { 
        await axios.post(`${API_URL}/create-chat`, { chat_id: newId }); 
        setChatId(newId); 
        setMessages([]); 
        loadChats();  
    } catch (err) { 
        alert("Could not create new chat. Is server running?"); 
    } 
}}> 
    ➕ New Chat 
</button> 
 
 
        <div className="section"> 
  <label>💬 Chats</label> 
 
  {chatList.map((chat, i) => ( 
  <div 
    key={i} 
    className="chat-item" 
    onClick={() => { 
      console.log("CLICK WORKING", chat.id); // 🔍 debug 
      loadChatMessages(chat.id); 
    }} 
  > 
    🧠 {chat.title} 
 
    <button 
      onClick={(e) => { 
        e.stopPropagation(); // 🔥 VERY IMPORTANT 
 
        axios.post(`${API_URL}/clear-history/${chat.id}`); 
 
        setChatList(prev => prev.filter(c => c.id !== chat.id)); 
 
        if (chat.id === chatId) { 
          setMessages([]); 
        } 
      }} 
    > 
      ❌ 
    </button> 
  </div> 
))} 
</div> 
 
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
            onChange={(e) => { 
  setFiles(Array.from(e.target.files)); 
}} 
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
          onClick={clearChat} 
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
              <ReactMarkdown 
  components={{ 
    pre({ children }) { 
      return ( 
        <pre style={{ 
          whiteSpace: "pre-wrap", 
          wordBreak: "break-word", 
          overflowWrap: "anywhere", 
          overflowX: "100%", 
          maxWidth: "100%", 
          background: "#1e1e1e", 
          padding: "12px", 
          borderRadius: "8px", 
          fontSize: "14px", 
          lineHeight: "1.6", 
          overflow: "visible", 
        }}> 
          {children} 
        </pre> 
      ); 
    }, 
    code({ children }) { 
      return ( 
        <code style={{ 
          whiteSpace: "pre-wrap", 
          wordBreak: "break-word", 
          overWrap: "break-word", 
        }}> 
          {children} 
        </code> 
      ); 
    } 
  }} 
> 
  {analysisResult} 
</ReactMarkdown> 
            </div> 
          )} 
        </div> 
      </main> 
    </div> 
  ); 
} 
 
export default App;