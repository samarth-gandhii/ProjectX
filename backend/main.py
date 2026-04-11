from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router

app = FastAPI(title="Bodh AI Backend Engine")

# Corrected CORS policy for Next.js compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000"
    ], # Explicitly allow your frontend
    allow_credentials=True, # Must be True when specific origins are listed
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API endpoints from routes.py
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "Bodh AI Engine is running."}