# Bodh AI

Bodh AI is a full-stack learning assistant that combines a Next.js frontend with a FastAPI backend to generate interactive educational content. It supports:

- Text explanations
- Quiz generation
- 3D simulations
- Video-oriented responses
- Prebuilt topic cards for learning paths like algorithms and space topics

## Project Overview

The frontend provides a clean, chat-style learning interface with navigation for home, search, history, and topic cards. The backend exposes generation endpoints powered by Gemini and local Falcon/Ollama models.

### Core Features

- Prompt-based learning assistant
- Model selection between Gemini and Falcon for text generation
- Context-aware content generation for:
  - Text
  - 3D simulations
  - Quizzes
  - Video responses
- Topic cards for curated content such as:
  - Dijkstra's Algorithm
  - A* Search
  - Greedy Algorithms
  - Solar System
  - Black Hole
- Markdown rendering for generated explanations
- Interactive 3D canvas support using Three.js

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- React Markdown

### Backend
- FastAPI
- Uvicorn
- Pydantic
- LangChain
- Google Gemini
- Ollama / Falcon

## Repository Structure


frontend/
  src/
    app/
    components/
    images/
  public/

backend/
  main.py
  api/
  schemas/
  services/
  Cards/
  utils/


  ### Prerequisites
Before running the project, make sure you have:

Node.js 18+ installed
Python 3.10+ installed
Ollama installed and running locally
A Gemini API key
A working internet connection for external model/API access

### Environment Variables
Create a .env file in the backend/ directory with at least:
GEMINI_API_KEY=your_gemini_api_key


## How It Works
###Home Page
The home page lets users enter a prompt, choose a model, and select a content type. It routes the request to the chat experience.

### Chat Experience
The chat page sends prompts to the backend and displays the generated response. Depending on the response type, it can also open:

### A 3D simulation panel
A quiz panel
Topic Cards
Topic cards load predefined educational content from the backend using topic IDs.

### API Endpoints
Health Check
GET /

Returns a simple backend status response.

###Generate Content
POST /api/generate

Generates educational content based on the user prompt and selected context type.

### Example request:

{
  "prompt": "Explain black holes",
  "history": [],
  "model_choice": "Gemini 2.5 Flash",
  "context_type": "Text"
}

### Supported context_type values:

Text
3D_simulation
Quiz
Video
Topic Cards
GET /api/cards/{topic_id}

### Example topic IDs:

dijkstra
a-star
greedy
solar-system
blackhole
### Frontend Routes
/ - Home page
/chat - Main chat interface
/search - Search page
/history - History page
/topic/[id] - Topic detail pages
/space/[id] - Space content pages
### Notes
The frontend currently points directly to http://localhost:8000 for backend requests.
For 3D simulations, the frontend renders generated Three.js code inside an embedded canvas.
Quiz generation returns structured quiz data for interactive rendering.
Video generation is currently implemented as a placeholder response in the backend.
Troubleshooting
###Backend connection errors
If the UI says it cannot connect to the backend, check that FastAPI is running on port 8000.

### Gemini errors
Make sure GEMINI_API_KEY is present in .env.

### Falcon errors
Make sure Ollama is installed, running, and the falcon3:7b model is available locally.

### 3D simulation issues
If a generated 3D scene fails to render, the issue is usually in the generated JavaScript code. Check the browser console and backend response.

### Development Notes
The backend generation flow is defined in main.py and routes.py.
Model wiring lives in services.
Curated card content is stored under Cards.
The main frontend entry point is page.tsx.
