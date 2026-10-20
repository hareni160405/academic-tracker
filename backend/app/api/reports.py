import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime, timedelta
import pytz
from app.core.database import get_db
from app.models.user import User
from app.models.study_session import StudySession
from app.models.task import Task
from app.models.assessment import Assessment, AssessmentAttempt
from app.schemas.reports import (
    PerformanceReportOut, WeakTopicDetail, SubjectPerformance, AttemptHistoryItem
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Performance Reports"])

def format_sec(sec: int) -> str:
    h = sec // 3600
    m = (sec % 3600) // 60
    return f"{h}h {m}m" if h > 0 else f"{m}m"

@router.get("", response_model=PerformanceReportOut)
def get_performance_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Study time aggregations
    all_sessions = db.query(StudySession).filter(StudySession.user_id == current_user.id).all()
    total_study_sec = sum(s.duration_seconds for s in all_sessions)

    # Weekly study
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    weekly_sessions = [s for s in all_sessions if s.start_time >= week_ago]
    weekly_study_sec = sum(s.duration_seconds for s in weekly_sessions)

    # Days with study in last 7 days
    days_studied = len({s.start_time.date() for s in weekly_sessions if s.duration_seconds > 0})
    consistency_score = round((days_studied / 7.0) * 100.0, 1)

    # 2. Task metrics
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    tasks_total = len(tasks)
    tasks_completed = sum(1 for t in tasks if t.is_completed)
    tasks_pending = tasks_total - tasks_completed
    completion_rate = round((tasks_completed / tasks_total * 100.0), 1) if tasks_total > 0 else 0.0

    # 3. Assessment metrics
    attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == current_user.id
    ).order_by(AssessmentAttempt.completed_at.desc()).all()

    total_assessments = len(attempts)
    avg_score = round(sum(a.percentage for a in attempts) / total_assessments, 1) if total_assessments > 0 else 0.0
    highest_score = max((a.percentage for a in attempts), default=0.0)
    latest_score = attempts[0].percentage if attempts else None

    # 4. Weak topics
    weak_topics_list: List[WeakTopicDetail] = []
    seen_weak = set()
    for a in attempts:
        if not a.is_passed and a.weak_topics_json:
            topics = json.loads(a.weak_topics_json)
            for t in topics:
                if t not in seen_weak:
                    seen_weak.add(t)
                    weak_topics_list.append(WeakTopicDetail(
                        topic=t,
                        assessment_title=a.assessment.title if a.assessment else t,
                        percentage=a.percentage,
                        assessment_id=a.assessment_id,
                        attempt_id=a.id,
                        date_flagged=a.completed_at
                    ))

    # 5. Subject performances
    subject_map: Dict[str, List[float]] = {}
    for a in attempts:
        subj = a.assessment.subject_topic if a.assessment else "General"
        if subj not in subject_map:
            subject_map[subj] = []
        subject_map[subj].append(a.percentage)

    subject_performances: List[SubjectPerformance] = []
    for subj, scores in subject_map.items():
        s_avg = round(sum(scores) / len(scores), 1)
        status_text = "EXCELLENT" if s_avg >= 80 else ("GOOD" if s_avg >= 60 else "NEEDS_IMPROVEMENT")
        subject_performances.append(SubjectPerformance(
            subject=subj,
            assessments_count=len(scores),
            average_score=s_avg,
            status=status_text
        ))

    # 6. Recent attempts
    recent_attempts = [
        AttemptHistoryItem(
            attempt_id=a.id,
            assessment_id=a.assessment_id,
            title=a.assessment.title if a.assessment else "Assessment",
            subject_topic=a.assessment.subject_topic if a.assessment else "General",
            score_obtained=a.score_obtained,
            total_possible=a.total_possible_score,
            percentage=a.percentage,
            is_passed=a.is_passed,
            completed_at=a.completed_at
        )
        for a in attempts[:10]
    ]

    # 7. AI Performance Insights synthesis
    if total_assessments == 0 and total_study_sec == 0:
        ai_insights = "Welcome to Academic Tracker! Start by scheduling study sessions with the timer and taking practice quizzes to generate your personalized learning analytics."
    elif weak_topics_list:
        ai_insights = f"You have {len(weak_topics_list)} topic(s) flagged for revision (including {weak_topics_list[0].topic}). Retaking these assessments with targeted 20-minute review sessions will significantly boost your mastery."
    elif avg_score >= 80:
        ai_insights = f"Outstanding academic momentum! Your average quiz score is {avg_score}% with a consistency rate of {consistency_score}%. Keep sustaining this routine for upcoming exams."
    else:
        ai_insights = f"Steady progress. Your overall quiz score average is {avg_score}%. Increasing active recall study intervals will help raise your retention past 80%."

    return PerformanceReportOut(
        total_study_seconds=total_study_sec,
        total_study_formatted=format_sec(total_study_sec),
        weekly_study_seconds=weekly_study_sec,
        weekly_study_formatted=format_sec(weekly_study_sec),
        study_consistency_score=consistency_score,
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        tasks_pending=tasks_pending,
        task_completion_rate=completion_rate,
        total_assessments_taken=total_assessments,
        average_assessment_percentage=avg_score,
        highest_assessment_percentage=highest_score,
        latest_assessment_percentage=latest_score,
        weak_topics=weak_topics_list,
        subject_performances=subject_performances,
        recent_attempts=recent_attempts,
        ai_insights=ai_insights
    )
