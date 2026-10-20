from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TimerStart(BaseModel):
    subject: Optional[str] = "General Study"
    notes: Optional[str] = None

class TimerStop(BaseModel):
    reason: Optional[str] = "MANUAL_STOP"  # MANUAL_STOP, BACKGROUND_SUSPEND, PAGE_UNLOAD
    notes: Optional[str] = None

class TimerHeartbeat(BaseModel):
    session_id: str

class StudySessionOut(BaseModel):
    id: str
    subject: str
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: int
    status: str
    last_heartbeat: datetime
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class DailyStudyPoint(BaseModel):
    date_str: str          # YYYY-MM-DD
    day_name: str          # Mon, Tue, etc.
    duration_seconds: int
    duration_minutes: float
    duration_formatted: str

class TimerStatus(BaseModel):
    is_active: bool
    current_session: Optional[StudySessionOut] = None
    today_total_seconds: int
    today_total_formatted: str
    daily_goal_minutes: int
    goal_progress_percentage: float

class StudyAnalyticsOut(BaseModel):
    today_seconds: int
    today_formatted: str
    weekly_total_seconds: int
    weekly_total_formatted: str
    daily_average_seconds: int
    daily_average_formatted: str
    total_sessions_count: int
    consistency_percentage: float
    weekly_history: List[DailyStudyPoint]
    recent_sessions: List[StudySessionOut]
