# Bodh AI

Bodh AI is a full-stack learning assistant that combines a Next.js frontend with a FastAPI backend to generate interactive educational content. It supports:

- Text explanations
- Quiz generation
- 3D simulations
- Video-oriented responses
- Prebuilt topic cards for learning paths like algorithms and space topics

## Project Overview

The frontend provides a clean, chat-style learning interface with navigation for home, search, history, and topic cards. The backend exposes generation endpoints powered by Gemini and local Falcon/Ollama models.

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

## Getting Started (Step-by-Step Guide)

This guide is designed to be easy to follow, even if you don't have a technical background!

### Step 1: Install Prerequisites

Before running the project, you'll need to install a few basic tools:
1. **Node.js**: Needed to run the frontend website. Download and install it from [nodejs.org](https://nodejs.org/). (Choose the "LTS" version. This will also install `npm`).
2. **Python**: Needed to run the backend engine. Download and install Python 3.10 or newer from [python.org](https://www.python.org/). **Important:** During installation, make sure to check the box at the bottom that says **"Add Python to PATH"**.
3. **Ollama (Optional but recommended)**: Needed if you want to use the local Falcon AI model. Download and install it from [ollama.com](https://ollama.com/). Once installed, open your command prompt/terminal and run `ollama run falcon3:7b` to download the AI model.
4. **Gemini API Key**: You'll need a free API key from Google for the main AI features. Get one from [Google AI Studio](https://aistudio.google.com/).

### Step 2: Set Up the Backend (Python)

1. Open your terminal or command prompt.
2. Navigate to the `backend` folder of this project:
   ```bash
   cd path/to/Bodh-AI/backend
   ```
3. **Create a Virtual Environment** (This keeps the project's dependencies isolated from the rest of your computer):
   ```bash
   python -m venv venv
   ```
4. **Activate the Virtual Environment**:
   - On **Windows**:
     ```bash
     venv\Scripts\activate
     ```
   - On **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```
   *(You should now see `(venv)` at the beginning of your command line, indicating it is active).*
5. **Install Required Packages**:
   ```bash
   pip install -r requirements.txt
   ```
6. **Set up Environment Variables**:
   - In the `backend` folder, create a new file and name it `.env`
   - Open it in a text editor (like Notepad) and add your Gemini API key like this:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

### Step 3: Set Up the Frontend (Node.js)

1. Open a new terminal or command prompt window.
2. Navigate to the `frontend` folder:
   ```bash
   cd path/to/Bodh-AI/frontend
   ```
3. Install the required Node packages:
   ```bash
   npm install
   ```

### Step 4: Running the Project (The Easy Way)

To make starting the project extremely easy every time, you can create a simple script that starts everything with one double-click.

1. Go to the main project folder (`Bodh-AI`).
2. Create a new text file and name it `start.bat`.
3. Right-click `start.bat`, select "Edit" (or open with Notepad), and paste the following code:

```bat
@echo off
echo Starting Ollama (Falcon AI) Server...
start cmd /k "ollama serve"

echo Starting Akriti Backend Engine...
start cmd /k "cd backend && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo Starting Akriti Next.js Frontend...
start cmd /k "cd frontend && npm run dev"

echo All servers are booting up! Close this window whenever you are ready.
```

4. Save and close the file. 
5. Now, whenever you want to run the project, just **double-click the `start.bat` file**! Three black windows will open, starting the AI server, backend, and frontend automatically.

Once everything is running, open your web browser and go to `http://localhost:3000` to start using Bodh AI.

### Gemini errors
Make sure GEMINI_API_KEY is present in .env.

### Falcon errors
Make sure Ollama is installed, running, and the falcon3:7b model is available locally.

### 3D simulation issues
If a generated 3D scene fails to render, the issue is usually in the generated JavaScript code. Check the browser console and backend response.