from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, time
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.calendar import CalendarEvent, PushSubscription
from app.schemas.calendar import EventCreate, EventUpdate, EventOut, PushSubscriptionCreate
from app.services.scheduler_service import calculate_8am_reminder
from app.api.deps import get_current_user

router = APIRouter(prefix="/calendar", tags=["Calendar and Reminders"])

@router.get("/vapid-key")
def get_vapid_public_key():
    return {"vapid_public_key": settings.VAPID_PUBLIC_KEY or ""}

@router.get("/events", response_model=List[EventOut])
def get_calendar_events(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id)
    return query.order_by(CalendarEvent.event_date.asc(), CalendarEvent.event_time.asc()).all()

@router.post("/events", response_model=EventOut, status_code=201)
def create_event(
    event_in: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate 8:00 AM morning reminder
    reminder_time = None
    if event_in.reminder_enabled:
        if event_in.custom_reminder_time:
            reminder_time = event_in.custom_reminder_time
        else:
            calc_reminder, is_past = calculate_8am_reminder(event_in.event_date, current_user.timezone)
            if is_past:
                # Event is today and 8:00 AM already passed; schedule immediate or before event
                now_utc = datetime.utcnow()
                reminder_time = now_utc
            else:
                reminder_time = calc_reminder

    event = CalendarEvent(
        user_id=current_user.id,
        title=event_in.title.strip(),
        description=event_in.description,
        event_date=event_in.event_date,
        event_time=event_in.event_time,
        category=event_in.category or "EXAM",
        reminder_enabled=event_in.reminder_enabled,
        reminder_time=reminder_time,
        reminder_sent=False
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/events/{event_id}", response_model=EventOut)
def update_event(
    event_id: str,
    event_in: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    if event_in.title is not None:
        event.title = event_in.title.strip()
    if event_in.description is not None:
        event.description = event_in.description
    if event_in.event_date is not None:
        event.event_date = event_in.event_date
    if event_in.event_time is not None:
        event.event_time = event_in.event_time
    if event_in.category is not None:
        event.category = event_in.category
    if event_in.reminder_enabled is not None:
        event.reminder_enabled = event_in.reminder_enabled
        if event.reminder_enabled:
            calc_reminder, is_past = calculate_8am_reminder(event.event_date, current_user.timezone)
            event.reminder_time = calc_reminder
            event.reminder_sent = False

    db.commit()
    db.refresh(event)
    return event

@router.delete("/events/{event_id}")
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}

@router.post("/push-subscription")
def save_push_subscription(
    sub_in: PushSubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == sub_in.endpoint
    ).first()

    if existing:
        existing.p256dh_key = sub_in.p256dh
        existing.auth_key = sub_in.auth
    else:
        new_sub = PushSubscription(
            user_id=current_user.id,
            endpoint=sub_in.endpoint,
            p256dh_key=sub_in.p256dh,
            auth_key=sub_in.auth
        )
        db.add(new_sub)
    
    db.commit()
    return {"message": "Push notification subscription saved successfully"}
