import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.models.user import User
from app.models.ai_chat import AiConversation, AiMessage
from app.models.assessment import AssessmentAttempt, Assessment
from app.models.task import Task
from app.models.calendar import CalendarEvent
from app.schemas.assistant import (
    ChatMessageInput, ChatMessageOut, ConversationOut, StudySuggestionOut
)
from app.services.ai_service import ai_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/assistant", tags=["AI Study Assistant"])

@router.post("/chat", response_model=ChatMessageOut)
def send_chat_message(
    chat_in: ChatMessageInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find or create conversation
    conv = None
    if chat_in.conversation_id:
        conv = db.query(AiConversation).filter(
            AiConversation.id == chat_in.conversation_id,
            AiConversation.user_id == current_user.id
        ).first()

    if not conv:
        title = chat_in.message[:40] + ("..." if len(chat_in.message) > 40 else "")
        conv = AiConversation(user_id=current_user.id, title=title)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = AiMessage(
        conversation_id=conv.id,
        sender="user",
        content=chat_in.message.strip()
    )
    db.add(user_msg)
    db.commit()

    # Gather weak topics context if requested
    weak_topics = []
    if chat_in.include_weak_topics_context:
        failed_attempts = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.user_id == current_user.id,
            AssessmentAttempt.is_passed == False
        ).order_by(AssessmentAttempt.completed_at.desc()).limit(5).all()
        for fa in failed_attempts:
            if fa.weak_topics_json:
                weak_topics.extend(json.loads(fa.weak_topics_json))

    # Build conversation history
    past_messages = db.query(AiMessage).filter(
        AiMessage.conversation_id == conv.id
    ).order_by(AiMessage.created_at.asc()).all()

    formatted_history = [{"sender": m.sender, "content": m.content} for m in past_messages]

    # Generate AI response
    reply_text = ai_service.generate_chat_response(
        user_message=chat_in.message,
        conversation_history=formatted_history,
        weak_topics=list(set(weak_topics))
    )

    assistant_msg = AiMessage(
        conversation_id=conv.id,
        sender="assistant",
        content=reply_text
    )
    db.add(assistant_msg)
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(assistant_msg)

    return ChatMessageOut(
        id=assistant_msg.id,
        sender=assistant_msg.sender,
        content=assistant_msg.content,
        created_at=assistant_msg.created_at
    )

@router.get("/conversations", response_model=List[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(AiConversation).filter(
        AiConversation.user_id == current_user.id
    ).order_by(AiConversation.updated_at.desc()).all()
    
    res = []
    for c in convs:
        msgs = db.query(AiMessage).filter(AiMessage.conversation_id == c.id).order_by(AiMessage.created_at.asc()).all()
        res.append(ConversationOut(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            messages=[ChatMessageOut(id=m.id, sender=m.sender, content=m.content, created_at=m.created_at) for m in msgs]
        ))
    return res

@router.get("/suggestions", response_model=List[StudySuggestionOut])
def get_study_suggestions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    suggestions = []

    # 1. Weak topics requiring revision
    recent_failed = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id,
        AssessmentAttempt.is_passed == False
    ).order_by(AssessmentAttempt.completed_at.desc()).first()

    if recent_failed and recent_failed.weak_topics_json:
        weak_list = json.loads(recent_failed.weak_topics_json)
        if weak_list:
            suggestions.append(StudySuggestionOut(
                title=f"Review Weak Topic: {weak_list[0]}",
                subject=weak_list[0],
                reason=f"Scored {recent_failed.percentage}% in recent assessment.",
                suggested_action=f"Launch a targeted 15-minute review and retake the quiz on {weak_list[0]}.",
                action_type="REVISE_TOPIC",
                reference_id=recent_failed.assessment_id
            ))

    # 2. Upcoming events / exams
    today = date.today()
    upcoming_event = db.query(CalendarEvent).filter(
        CalendarEvent.user_id == current_user.id,
        CalendarEvent.event_date >= today
    ).order_by(CalendarEvent.event_date.asc()).first()

    if upcoming_event:
        suggestions.append(StudySuggestionOut(
            title=f"Prepare for {upcoming_event.title}",
            subject=upcoming_event.category,
            reason=f"Scheduled for {upcoming_event.event_date}.",
            suggested_action=f"Dedicate a 45-minute focused session to prepare relevant notes.",
            action_type="STUDY_SESSION",
            reference_id=upcoming_event.id
        ))

    # 3. High priority pending tasks
    pending_task = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.is_completed == False,
        Task.priority == "HIGH"
    ).order_by(Task.due_date.asc().nullslast()).first()

    if pending_task:
        suggestions.append(StudySuggestionOut(
            title=f"Priority Task: {pending_task.title}",
            subject=pending_task.category,
            reason="High priority academic to-do item.",
            suggested_action="Complete this item to maintain your daily study consistency.",
            action_type="COMPLETE_TASK",
            reference_id=pending_task.id
        ))

    # Default encouragement if no urgent items
    if not suggestions:
        suggestions.append(StudySuggestionOut(
            title="Consistent Study Routine",
            subject="General",
            reason="All immediate tasks and quizzes are up to date!",
            suggested_action="Start a 25-minute Pomodoro study session on your preferred core topic.",
            action_type="STUDY_SESSION",
            reference_id=None
        ))

    return suggestions
