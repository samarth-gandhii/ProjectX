import os
from dotenv import load_dotenv
from langchain_community.llms import Ollama
from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables (like your GEMINI_API_KEY)
load_dotenv()

# 1. Initialize Local Falcon 7B
# Make sure Ollama is running on your machine and you have pulled the falcon model: `ollama run falcon`
falcon_llm = Ollama(model="falcon3:7b")

# 2. Blueprint Expansion (API_KEY_1)
blueprint_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY_1"),
    temperature=0.4
)

# 3. Code Generation (API_KEY_2)
generation_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY_2"),
    temperature=0.4
)