from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class AssessmentGenerateRequest(BaseModel):
    title: Optional[str] = None
    subject_topic: str
    assessment_type: Optional[str] = "MCQ" # MCQ, TRUE_FALSE, SHORT_ANSWER
    difficulty: Optional[str] = "MEDIUM"   # EASY, MEDIUM, HARD
    question_count: Optional[int] = 5
    time_limit_minutes: Optional[int] = 10 # 0 for untimed
    text_content: Optional[str] = None
    material_id: Optional[str] = None

class QuestionOut(BaseModel):
    id: str
    question_number: int
    question_text: str
    question_type: str
    options: List[str]
    points: int

    class Config:
        from_attributes = True

class AssessmentOut(BaseModel):
    id: str
    title: str
    subject_topic: str
    assessment_type: str
    difficulty: str
    time_limit_minutes: int
    passing_threshold: float
    question_count: int
    questions: List[QuestionOut]
    created_at: datetime

    class Config:
        from_attributes = True

class StudentAnswerInput(BaseModel):
    question_id: str
    answer: str

class AssessmentSubmitRequest(BaseModel):
    answers: List[StudentAnswerInput]
    time_spent_seconds: int

class QuestionResultOut(BaseModel):
    question_id: str
    question_number: int
    question_text: str
    question_type: str
    options: List[str]
    student_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    points_awarded: float
    explanation: Optional[str]

class AttemptResultOut(BaseModel):
    attempt_id: str
    assessment_id: str
    title: str
    subject_topic: str
    score_obtained: float
    total_possible_score: float
    percentage: float
    is_passed: bool
    time_spent_seconds: int
    weak_topics: List[str]
    questions: List[QuestionResultOut]
    completed_at: datetime
    revision_plan: Optional[List[str]] = None

class AssessmentListItem(BaseModel):
    id: str
    title: str
    subject_topic: str
    assessment_type: str
    difficulty: str
    time_limit_minutes: int
    question_count: int
    latest_percentage: Optional[float] = None
    attempts_count: int = 0
    created_at: datetime
