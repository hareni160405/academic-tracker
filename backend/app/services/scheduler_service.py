import datetime
import pytz
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.calendar import CalendarEvent, PushSubscription
from app.models.user import User

def calculate_8am_reminder(event_date: datetime.date, user_timezone_str: str = "Asia/Kolkata") -> Tuple[datetime.datetime, bool]:
    """
    Computes the 8:00 AM timestamp on event_date in user's timezone.
    Returns (reminder_datetime_utc, is_already_past).
    """
    try:
        tz = pytz.timezone(user_timezone_str)
    except Exception:
        tz = pytz.timezone("UTC")
    
    # 8:00 AM on event_date in user's timezone
    local_reminder = tz.localize(datetime.datetime.combine(event_date, datetime.time(8, 0, 0)))
    now_local = datetime.datetime.now(tz)
    
    is_past = local_reminder <= now_local
    
    # Convert to naive UTC for consistent DB storage
    utc_reminder = local_reminder.astimezone(pytz.UTC).replace(tzinfo=None)
    return utc_reminder, is_past

def send_web_push(subscription: PushSubscription, title: str, body: str, url: str = "/calendar"):
    """
    Sends Web Push notification using pywebpush if VAPID credentials are configured.
    """
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        print(f"[PushNotification] (Simulated Web Push): Title='{title}' Body='{body}' Target={url}")
        return False

    try:
        from pywebpush import webpush
        import json
        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "icon": "/icons/icon-192x192.png",
            "badge": "/icons/badge-72x72.png"
        })
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh_key,
                    "auth": subscription.auth_key
                }
            },
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIM_EMAIL}"}
        )
        return True
    except Exception as e:
        print(f"[PushNotification] Failed to send push: {e}")
        return False

def check_and_send_due_reminders(db: Session):
    """
    Cron / periodic worker checking for events whose reminder_time <= utcnow and not yet sent.
    """
    now_utc = datetime.datetime.utcnow()
    due_events = db.query(CalendarEvent).filter(
        CalendarEvent.reminder_enabled == True,
        CalendarEvent.reminder_sent == False,
        CalendarEvent.reminder_time <= now_utc
    ).all()

    for event in due_events:
        user = db.query(User).filter(User.id == event.user_id).first()
        if user:
            # Check subscriptions
            subscriptions = db.query(PushSubscription).filter(PushSubscription.user_id == user.id).all()
            title = f"Academic Reminder: {event.title}"
            body = f"Scheduled for today: {event.category} - {event.description or 'No details provided'}"
            for sub in subscriptions:
                send_web_push(sub, title, body, url="/calendar")
        
        event.reminder_sent = True
    
    if due_events:
        db.commit()
