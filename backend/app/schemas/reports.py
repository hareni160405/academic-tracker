from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class SubjectPerformance(BaseModel):
    subject: str
    assessments_count: int
    average_score: float
    status: str # "EXCELLENT", "GOOD", "NEEDS_IMPROVEMENT"

class AttemptHistoryItem(BaseModel):
    attempt_id: str
    assessment_id: str
    title: str
    subject_topic: str
    score_obtained: float
    total_possible: float
    percentage: float
    is_passed: bool
    completed_at: datetime

class WeakTopicDetail(BaseModel):
    topic: str
    assessment_title: str
    percentage: float
    assessment_id: str
    attempt_id: str
    date_flagged: datetime

class PerformanceReportOut(BaseModel):
    total_study_seconds: int
    total_study_formatted: str
    weekly_study_seconds: int
    weekly_study_formatted: str
    study_consistency_score: float # 0 - 100%
    
    tasks_total: int
    tasks_completed: int
    tasks_pending: int
    task_completion_rate: float
    
    total_assessments_taken: int
    average_assessment_percentage: float
    highest_assessment_percentage: float
    latest_assessment_percentage: Optional[float]
    
    weak_topics: List[WeakTopicDetail]
    subject_performances: List[SubjectPerformance]
    recent_attempts: List[AttemptHistoryItem]
    ai_insights: str
