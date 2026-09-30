import os
import shutil
import gc
import uuid  
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import CharacterTextSplitter

class RAGEngine:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = None
        self.current_db_path = None

    def clear_db(self):
        """Purane vectorstore ko memory se hatao"""
        self.vectorstore = None
        gc.collect()
        
        print("--- Session Reset: Ready for fresh files ---")

    def add_documents(self, text, filename):
        if not text or not text.strip():
            return

        
        if self.vectorstore is None:
            unique_id = str(uuid.uuid4())[:8]
            self.current_db_path = f"./db_{unique_id}"
        
        splitter = CharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        chunks = splitter.split_text(text)
        tagged_chunks = [f"[FILE: {filename}] {chunk}" for chunk in chunks]

        if self.vectorstore is None:
            # Naya folder create hoga yahan
            self.vectorstore = Chroma.from_texts(
                texts=tagged_chunks, 
                embedding=self.embeddings,
                persist_directory=self.current_db_path
            )
        else:
            
            self.vectorstore.add_texts(tagged_chunks)

    def search(self, query):
        if not self.vectorstore:
            return ""
        
        docs = self.vectorstore.similarity_search(query, k=15)
        return "\n\n".join([doc.page_content for doc in docs])
