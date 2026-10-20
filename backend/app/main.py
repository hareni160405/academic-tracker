import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.auth import router as auth_router
from app.api.tasks import router as tasks_router
from app.api.timer import router as timer_router
from app.api.calendar_events import router as calendar_router
from app.api.assessments import router as assessments_router
from app.api.assistant import router as assistant_router
from app.api.reports import router as reports_router
from app.services.scheduler_service import check_and_send_due_reminders

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_TITLE,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Background scheduler for 8:00 AM reminders
scheduler = BackgroundScheduler()

def scheduled_reminder_job():
    db = SessionLocal()
    try:
        check_and_send_due_reminders(db)
    finally:
        db.close()

scheduler.add_job(scheduled_reminder_job, "interval", seconds=60, id="reminder_dispatcher")
scheduler.start()

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(tasks_router, prefix=settings.API_V1_STR)
app.include_router(timer_router, prefix=settings.API_V1_STR)
app.include_router(calendar_router, prefix=settings.API_V1_STR)
app.include_router(assessments_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "title": settings.PROJECT_TITLE,
        "version": settings.VERSION
    }

# Mount Frontend static files if built
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "frontend",
    "dist"
)

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    if os.path.exists(os.path.join(frontend_dist, "icons")):
        app.mount("/icons", StaticFiles(directory=os.path.join(frontend_dist, "icons")), name="icons")

    @app.get("/manifest.webmanifest")
    def get_manifest():
        return FileResponse(os.path.join(frontend_dist, "manifest.webmanifest"), media_type="application/manifest+json")

    @app.get("/sw.js")
    def get_sw():
        return FileResponse(os.path.join(frontend_dist, "sw.js"), media_type="application/javascript")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

@app.on_event("shutdown")
def shutdown_event():
    if scheduler.running:
        scheduler.shutdown(wait=False)
