from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, date
import pytz
from app.core.database import get_db
from app.models.user import User
from app.models.study_session import StudySession
from app.schemas.timer import (
    TimerStart, TimerStop, TimerHeartbeat, TimerStatus,
    StudySessionOut, StudyAnalyticsOut, DailyStudyPoint
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/timer", tags=["Study Tracker"])

def get_user_tz(user: User):
    try:
        return pytz.timezone(user.timezone or "Asia/Kolkata")
    except Exception:
        return pytz.timezone("UTC")

def format_seconds(seconds: int) -> str:
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"

def reconcile_stale_sessions(user_id: str, db: Session):
    """
    If there is an ACTIVE session whose last_heartbeat is older than 90 seconds,
    the user must have closed or force-killed the app without clean stop.
    We safely finalize the session at last_heartbeat without inventing unverified time.
    """
    now = datetime.utcnow()
    stale_cutoff = now - timedelta(seconds=90)
    
    stale_sessions = db.query(StudySession).filter(
        StudySession.user_id == user_id,
        StudySession.status == "ACTIVE",
        StudySession.last_heartbeat < stale_cutoff
    ).all()

    for s in stale_sessions:
        duration = int((s.last_heartbeat - s.start_time).total_seconds())
        s.duration_seconds = max(0, duration)
        s.end_time = s.last_heartbeat
        s.status = "INTERRUPTED"
    
    if stale_sessions:
        db.commit()

@router.get("/status", response_model=TimerStatus)
def get_timer_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reconcile_stale_sessions(current_user.id, db)
    
    # Active session check
    active_session = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.status == "ACTIVE"
    ).first()

    # Calculate today's study seconds in user's timezone
    user_tz = get_user_tz(current_user)
    now_local = datetime.now(user_tz)
    today_start_local = user_tz.localize(datetime.combine(now_local.date(), datetime.min.time()))
    today_start_utc = today_start_local.astimezone(pytz.UTC).replace(tzinfo=None)

    # Sum of completed/interrupted sessions today + current running session
    today_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.start_time >= today_start_utc
    ).all()

    today_total = 0
    now_utc = datetime.utcnow()
    for s in today_sessions:
        if s.status == "ACTIVE":
            elapsed = int((now_utc - s.start_time).total_seconds())
            today_total += max(0, elapsed)
        else:
            today_total += s.duration_seconds

    goal_seconds = current_user.daily_goal_minutes * 60
    progress = round((today_total / goal_seconds * 100.0), 1) if goal_seconds > 0 else 0.0

    return {
        "is_active": active_session is not None,
        "current_session": active_session,
        "today_total_seconds": today_total,
        "today_total_formatted": format_seconds(today_total),
        "daily_goal_minutes": current_user.daily_goal_minutes,
        "goal_progress_percentage": min(100.0, progress)
    }

@router.post("/start", response_model=StudySessionOut)
def start_timer(
    start_in: TimerStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reconcile_stale_sessions(current_user.id, db)

    # Check if there is already an active session
    existing_active = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.status == "ACTIVE"
    ).first()

    now = datetime.utcnow()
    if existing_active:
        # Update heartbeat and return existing active session
        existing_active.last_heartbeat = now
        db.commit()
        db.refresh(existing_active)
        return existing_active

    new_session = StudySession(
        user_id=current_user.id,
        subject=start_in.subject or "General Study",
        start_time=now,
        last_heartbeat=now,
        status="ACTIVE",
        notes=start_in.notes
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/heartbeat")
def timer_heartbeat(
    heartbeat_in: TimerHeartbeat,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(StudySession).filter(
        StudySession.id == heartbeat_in.session_id,
        StudySession.user_id == current_user.id,
        StudySession.status == "ACTIVE"
    ).first()

    if not session:
        return {"status": "NO_ACTIVE_SESSION"}

    session.last_heartbeat = datetime.utcnow()
    db.commit()
    return {"status": "OK", "heartbeat": session.last_heartbeat}

@router.post("/stop", response_model=StudySessionOut)
def stop_timer(
    stop_in: TimerStop,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(StudySession).filter(
        StudySession.user_id == current_user.id,
        StudySession.status == "ACTIVE"
    ).first()

    if not session:
        # Check latest completed session if already stopped
        latest = db.query(StudySession).filter(
            StudySession.user_id == current_user.id
        ).order_by(StudySession.start_time.desc()).first()
        if latest:
            return latest
        raise HTTPException(status_code=400, detail="No active study session to stop")

    now = datetime.utcnow()
    duration = int((now - session.start_time).total_seconds())
    session.end_time = now
    session.last_heartbeat = now
    session.duration_seconds = max(1, duration)
    session.status = "COMPLETED"
    if stop_in.notes:
        session.notes = (session.notes or "") + (" " + stop_in.notes)
    
    db.commit()
    db.refresh(session)
    return session

@router.get("/analytics", response_model=StudyAnalyticsOut)
def get_study_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reconcile_stale_sessions(current_user.id, db)
    user_tz = get_user_tz(current_user)
    now_local = datetime.now(user_tz)
    
    # 7-day range (today and past 6 days)
    days_data: List[DailyStudyPoint] = []
    days_with_study = 0
    weekly_total_seconds = 0
    today_seconds = 0

    for i in range(6, -1, -1):
        target_date = (now_local - timedelta(days=i)).date()
        target_start = user_tz.localize(datetime.combine(target_date, datetime.min.time())).astimezone(pytz.UTC).replace(tzinfo=None)
        target_end = user_tz.localize(datetime.combine(target_date, datetime.max.time())).astimezone(pytz.UTC).replace(tzinfo=None)

        day_sessions = db.query(StudySession).filter(
            StudySession.user_id == current_user.id,
            StudySession.start_time >= target_start,
            StudySession.start_time <= target_end
        ).all()

        day_sec = sum(s.duration_seconds for s in day_sessions)
        if i == 0:
            today_seconds = day_sec

        if day_sec > 0:
            days_with_study += 1
        weekly_total_seconds += day_sec

        days_data.append(DailyStudyPoint(
            date_str=target_date.strftime("%Y-%m-%d"),
            day_name=target_date.strftime("%a"),
            duration_seconds=day_sec,
            duration_minutes=round(day_sec / 60.0, 1),
            duration_formatted=format_seconds(day_sec)
        ))

    daily_avg = int(weekly_total_seconds / 7)
    consistency = round((days_with_study / 7.0) * 100.0, 1)

    recent_sessions = db.query(StudySession).filter(
        StudySession.user_id == current_user.id
    ).order_by(StudySession.start_time.desc()).limit(15).all()

    total_sessions_count = db.query(StudySession).filter(StudySession.user_id == current_user.id).count()

    return {
        "today_seconds": today_seconds,
        "today_formatted": format_seconds(today_seconds),
        "weekly_total_seconds": weekly_total_seconds,
        "weekly_total_formatted": format_seconds(weekly_total_seconds),
        "daily_average_seconds": daily_avg,
        "daily_average_formatted": format_seconds(daily_avg),
        "total_sessions_count": total_sessions_count,
        "consistency_percentage": consistency,
        "weekly_history": days_data,
        "recent_sessions": recent_sessions
    }
