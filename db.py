import sqlite3

DB_NAME = "chat.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id TEXT,
            role TEXT,
            content TEXT
        )
    """)
    conn.commit()
    conn.close()

def create_chat(chat_id, title="New Chat"):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute("SELECT 1 FROM messages WHERE chat_id = ? AND role = 'system'", (chat_id,))
    if not c.fetchone():
        c.execute(
            "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)",
            (chat_id, "system", title)
        )
        conn.commit()
    conn.close()

def save_message(chat_id, role, content):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute(
        "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)",
        (chat_id, role, content)
    )
    conn.commit()
    conn.close()

def get_messages(chat_id):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute(
        "SELECT role, content FROM messages WHERE chat_id = ? AND role != 'system' ORDER BY id ASC",
        (chat_id,)
    )
    rows = c.fetchall()
    conn.close()
    return [{"role": r, "content": c} for r, c in rows]

def get_all_chats():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute("SELECT chat_id, content FROM messages WHERE role='system'")
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "title": r[1]} for r in rows]

def clear_messages(chat_id=None):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    if chat_id:
        
        c.execute("DELETE FROM messages WHERE chat_id = ?", (chat_id,))
    else:
        c.execute("DELETE FROM messages")
    conn.commit()
    conn.close()

def update_chat_title(chat_id, new_title):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    short_title = (new_title[:30] + '...') if len(new_title) > 30 else new_title
    c.execute("UPDATE messages SET content = ? WHERE chat_id = ? AND role = 'system'", (short_title, chat_id))
    conn.commit()
    conn.close()
