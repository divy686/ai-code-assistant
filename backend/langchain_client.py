import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

load_dotenv()

class LangChainClient:
    def __init__(self, mode="General"):     
        self.role_prompts = {
            "Code Analysis": "Expert code analyst. Clear explanations.",
            "Code Generator": "Senior developer. Production-ready code.",
            "Debugger": "Expert debugger. Find issues, suggest fixes.",  
            "Code Guide": "Step-by-step coding mentor.",
            "Optimization": "Performance and efficiency expert.",
            "Explain Code": "Beginner-friendly code explanations.",
            "Project Builder": "Full-stack project architect.",
            "Documentation": "Professional software documentation writer.",
            "General": "Helpful AI coding assistant."
        }
        self.set_mode(mode)
        self.model = ChatOpenAI(
            model="openai/gpt-4o-mini",
            temperature=0.2,
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_API_BASE")
        )

    def set_mode(self, mode):
        self.system_prompt = self.role_prompts.get(mode, self.role_prompts["General"])

    def chat(self, messages):
        prompt_messages = [SystemMessage(content=self.system_prompt)]
        for m in messages:
            role = m.get("role")
            content = m.get("content")
            if role == "user": prompt_messages.append(HumanMessage(content=content))
            else: prompt_messages.append(AIMessage(content=content))
        return self.model.invoke(prompt_messages).content
