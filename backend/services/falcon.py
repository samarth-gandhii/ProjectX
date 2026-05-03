from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from services.llm_client import blueprint_llm
from services.llm_client import falcon_llm
# ---------------------------------------------------------
# 1. TEXT ROUTE (Markdown & Flowcharts)
# ---------------------------------------------------------
async def generate_falcon_text(prompt: str) -> str:
    """Handles standard text explanations locally."""
    template = ChatPromptTemplate.from_messages([
        ("system", "You are an AI tutor. Explain concepts clearly using Markdown (Headings, bullet points, bolding)."),
        ("human", "{concept}")
    ])
    
    # chain = template | falcon_llm
    chain = template | blueprint_llm
    response = await chain.ainvoke({"concept": prompt})
    return response if isinstance(response, str) else getattr(response, "content", str(response))

# ---------------------------------------------------------
# 2. PIPELINE ROUTE (The Architect with Memory)
# ---------------------------------------------------------
async def expand_prompt(prompt: str, history: list, context_type: str, architect_choice: str = "Gemini") -> str:
    """
    Acts as the Prompt Engineer for Gemini. 
    Uses sliding window history to maintain context.
    Expands a short user query into a detailed architectural blueprint.

    """
    
    # 1. Define the Architectural Instructions as a System Message
    system_instructions = f"""You are an expert prompt engineer and data scientist. The user wants a {context_type} representing this concept: '{prompt}'.
    Write a highly detailed, professional prompt that will be sent to a specialist AI to build this {context_type}.
    Include required visual details, structural instructions, coordinate mapping, and core logic to represent the data science concept accurately.
    Output ONLY the expanded prompt, without introductory text.

STRUCTURE FOR YOUR OUTPUT:
1. Persona: Act as a World-Class AI Visual Educator.
2. Visual Narrative: Describe the landscape, lighting, and color-coding.

5. Technical Constraints: Standard Three.js, NO imports/exports, Global THREE/OrbitControls, NO third-party libs like dat.gui.

Output ONLY the expanded prompt inside a single block. No conversational intro."""

    # 2. Build the Chat Template
    # MessagesPlaceholder is where the sliding window history will be injected
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_instructions),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", f"Create/Update the architecture for: {{prompt}}")
    ])

    # 3. Apply Sliding Window (Last 6 messages)
    # This is safe even if history is empty []
    trimmed_history = history[-4:] if history else []

    # 4. Execute the Chain
    if architect_choice in ["Ollama", "Falcon"]:
        chain = prompt_template | falcon_llm
    else:
        chain = prompt_template | blueprint_llm
    
    response = await chain.ainvoke({
        "chat_history": trimmed_history,
        "prompt": prompt
    })
    
    return response if isinstance(response, str) else getattr(response, "content", str(response))

#  3. Core Logic: Identify formulas (e.g., Runge-Kutta) and the "Aha!" moment.
# 4. Interaction: Define HUD-style sliders (Mass, Velocity, etc.).