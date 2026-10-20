from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessageInput(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    include_weak_topics_context: Optional[bool] = True

class ChatMessageOut(BaseModel):
    id: str
    sender: str  # user or assistant
    content: str
    created_at: datetime

class ConversationOut(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageOut] = []

class StudySuggestionOut(BaseModel):
    title: str
    subject: str
    reason: str
    suggested_action: str
    action_type: str  # "REVISE_TOPIC", "TAKE_QUIZ", "STUDY_SESSION", "COMPLETE_TASK"
    reference_id: Optional[str] = None
