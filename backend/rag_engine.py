from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

class RAGEngine:
    def __init__(self):
        self.texts = []
        self.vectorstore = None
        self.embeddings = OpenAIEmbeddings()

    # 🔥 Documents add with filename context
    def add_documents(self, text, filename):
        splitter = CharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )

        chunks = splitter.split_text(text)

        # ✅ FILE NAME TAGGING (VERY IMPORTANT)
        tagged_chunks = [
            f"📄 File: {filename}\n{chunk}" for chunk in chunks
        ]

        self.texts.extend(tagged_chunks)

        # ✅ Vector DB create/update
        self.vectorstore = Chroma.from_texts(
            texts=self.texts,
            embedding=self.embeddings
        )

    # 🔍 Search relevant context
    def search(self, query):
        if not self.vectorstore:
            return ""

        docs = self.vectorstore.similarity_search(query, k=20)

        # ✅ Better separation
        return "\n\n".join([doc.page_content for doc in docs])