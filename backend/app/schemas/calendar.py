from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: date
    event_time: Optional[time] = None
    category: Optional[str] = "EXAM"  # EXAM, ASSIGNMENT, PROJECT, REVISION, COLLEGE, STUDY
    reminder_enabled: Optional[bool] = True
    custom_reminder_time: Optional[datetime] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[date] = None
    event_time: Optional[time] = None
    category: Optional[str] = None
    reminder_enabled: Optional[bool] = None
    custom_reminder_time: Optional[datetime] = None

class EventOut(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    event_date: date
    event_time: Optional[time]
    category: str
    reminder_enabled: bool
    reminder_time: Optional[datetime]
    reminder_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
