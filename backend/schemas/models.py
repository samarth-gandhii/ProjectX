from pydantic import BaseModel
from typing import Optional, Any

class GenerateRequest(BaseModel):
    prompt: str
    history: Optional[list[dict[str, str]]] = []
    model_choice: Optional[str] = "Gemini 2.5 Flash"  # Updated default
    context_type: Optional[str] = "Text"              # Updated default
    architect_choice: Optional[str] = "Gemini"         # New prompt architect model

class GenerateResponse(BaseModel):
    text_explanation: str
    canvas_code: Optional[str] = None  
    video_url: Optional[str] = None    
    video_script: Optional[str] = None # Added for video.py
    quiz_data: Optional[Any] = None    # Added for quiz.py
    media_type: Optional[str] = "Text" # Added so frontend knows what panel to open
    model_used: Optional[str] = "Gemini 2.5 Flash"