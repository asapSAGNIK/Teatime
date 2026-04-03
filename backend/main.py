from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI(title="AetherNews API", description="AI-native autonomous newsroom")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "time": time.time()}


# --- Routers & startup (imported after app is created to avoid circular issues) ---
from api.articles import router as articles_router
from api.trending import router as trending_router
from scheduler import pipeline_job, start_scheduler
from database.db import init_db

app.include_router(articles_router, prefix="/api")
app.include_router(trending_router, prefix="/api")


@app.on_event("startup")
async def on_startup():
    await init_db()
    start_scheduler()


@app.post("/api/pipeline/run")
async def trigger_pipeline(background_tasks: BackgroundTasks):
    background_tasks.add_task(pipeline_job)
    return {"message": "Pipeline run started in the background."}
