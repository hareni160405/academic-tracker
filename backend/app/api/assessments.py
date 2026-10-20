import os
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.assessment import (
    StudyMaterial, Assessment, AssessmentQuestion, AssessmentAttempt, StudentAnswer
)
from app.schemas.assessment import (
    AssessmentGenerateRequest, AssessmentOut, QuestionOut,
    AssessmentSubmitRequest, AttemptResultOut, QuestionResultOut,
    AssessmentListItem
)
from app.services.pdf_service import PDFService
from app.services.ai_service import ai_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/assessments", tags=["Assessments and Quizzes"])

@router.post("/upload-material")
async def upload_material(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith((".pdf", ".txt")):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF or TXT file."
        )

    ext = "PDF" if file.filename.lower().endswith(".pdf") else "TXT"
    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)

    content_bytes = await file.read()
    with open(file_path, "wb") as f:
        f.write(content_bytes)

    # Extract text
    extracted_text = PDFService.extract_text_from_file(file_path, ext)

    material = StudyMaterial(
        user_id=current_user.id,
        original_filename=file.filename,
        stored_filename=unique_name,
        file_type=ext,
        file_size=len(content_bytes),
        extracted_content=extracted_text
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return {
        "material_id": material.id,
        "filename": material.original_filename,
        "extracted_preview": extracted_text[:300] + "..." if len(extracted_text) > 300 else extracted_text
    }

@router.post("/generate", response_model=AssessmentOut)
def generate_assessment(
    req: AssessmentGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    source_content = req.text_content or ""
    if req.material_id:
        mat = db.query(StudyMaterial).filter(
            StudyMaterial.id == req.material_id,
            StudyMaterial.user_id == current_user.id
        ).first()
        if mat and mat.extracted_content:
            source_content = mat.extracted_content + "\n" + source_content

    count = max(3, min(20, req.question_count or 5))
    diff = req.difficulty or "MEDIUM"
    atype = req.assessment_type or "MCQ"
    title = req.title or f"{req.subject_topic} Assessment"

    # Call AI generation service
    raw_questions = ai_service.generate_assessment_questions(
        topic=req.subject_topic,
        content=source_content,
        assessment_type=atype,
        difficulty=diff,
        count=count
    )

    new_assessment = Assessment(
        user_id=current_user.id,
        material_id=req.material_id,
        title=title,
        subject_topic=req.subject_topic,
        assessment_type=atype,
        difficulty=diff,
        time_limit_minutes=req.time_limit_minutes if req.time_limit_minutes is not None else 10,
        passing_threshold=current_user.passing_threshold
    )
    db.add(new_assessment)
    db.flush()

    question_objects = []
    for q_idx, q_data in enumerate(raw_questions, 1):
        q = AssessmentQuestion(
            assessment_id=new_assessment.id,
            question_number=q_idx,
            question_text=q_data.get("question_text", f"Question {q_idx}"),
            question_type=q_data.get("question_type", atype),
            options_json=json.dumps(q_data.get("options", [])),
            correct_answer=q_data.get("correct_answer", "Option A"),
            explanation=q_data.get("explanation", ""),
            points=1
        )
        db.add(q)
        question_objects.append(q)

    db.commit()
    db.refresh(new_assessment)

    # Format output (hide correct answers and explanations for taking test)
    questions_out = [
        QuestionOut(
            id=q.id,
            question_number=q.question_number,
            question_text=q.question_text,
            question_type=q.question_type,
            options=json.loads(q.options_json) if q.options_json else [],
            points=q.points
        )
        for q in question_objects
    ]

    return AssessmentOut(
        id=new_assessment.id,
        title=new_assessment.title,
        subject_topic=new_assessment.subject_topic,
        assessment_type=new_assessment.assessment_type,
        difficulty=new_assessment.difficulty,
        time_limit_minutes=new_assessment.time_limit_minutes,
        passing_threshold=new_assessment.passing_threshold,
        question_count=len(questions_out),
        questions=questions_out,
        created_at=new_assessment.created_at
    )

@router.get("", response_model=List[AssessmentListItem])
def list_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessments = db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).all()
    results = []
    for a in assessments:
        attempts = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.assessment_id == a.id,
            AssessmentAttempt.user_id == current_user.id
        ).order_by(AssessmentAttempt.attempt_number.desc()).all()

        latest_pct = attempts[0].percentage if attempts else None
        q_count = db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == a.id).count()

        results.append(AssessmentListItem(
            id=a.id,
            title=a.title,
            subject_topic=a.subject_topic,
            assessment_type=a.assessment_type,
            difficulty=a.difficulty,
            time_limit_minutes=a.time_limit_minutes,
            question_count=q_count,
            latest_percentage=latest_pct,
            attempts_count=len(attempts),
            created_at=a.created_at
        ))
    return results

@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    a = db.query(Assessment).filter(Assessment.id == assessment_id, Assessment.user_id == current_user.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == a.id).order_by(AssessmentQuestion.question_number.asc()).all()
    questions_out = [
        QuestionOut(
            id=q.id,
            question_number=q.question_number,
            question_text=q.question_text,
            question_type=q.question_type,
            options=json.loads(q.options_json) if q.options_json else [],
            points=q.points
        )
        for q in questions
    ]

    return AssessmentOut(
        id=a.id,
        title=a.title,
        subject_topic=a.subject_topic,
        assessment_type=a.assessment_type,
        difficulty=a.difficulty,
        time_limit_minutes=a.time_limit_minutes,
        passing_threshold=a.passing_threshold,
        question_count=len(questions_out),
        questions=questions_out,
        created_at=a.created_at
    )

@router.post("/{assessment_id}/submit", response_model=AttemptResultOut)
def submit_assessment(
    assessment_id: str,
    submission: AssessmentSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(Assessment).filter(
        Assessment.id == assessment_id,
        Assessment.user_id == current_user.id
    ).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    questions = db.query(AssessmentQuestion).filter(AssessmentQuestion.assessment_id == assessment.id).all()
    q_map = {q.id: q for q in questions}

    previous_attempts_count = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.assessment_id == assessment.id,
        AssessmentAttempt.user_id == current_user.id
    ).count()

    total_possible = sum(q.points for q in questions)
    score_obtained = 0.0
    ans_map = {a.question_id: a.answer for a in submission.answers}
    
    new_attempt = AssessmentAttempt(
        assessment_id=assessment.id,
        user_id=current_user.id,
        attempt_number=previous_attempts_count + 1,
        time_spent_seconds=submission.time_spent_seconds
    )
    db.add(new_attempt)
    db.flush()

    question_results: List[QuestionResultOut] = []
    weak_topics = set()

    for q in questions:
        st_ans = ans_map.get(q.id, "").strip()
        correct_ans = q.correct_answer.strip()
        
        # Grading
        is_correct = False
        if q.question_type in ["MCQ", "TRUE_FALSE"]:
            is_correct = (st_ans.lower() == correct_ans.lower()) or (st_ans.startswith(correct_ans[:2]) if len(st_ans) > 2 and len(correct_ans) > 2 else False)
        else:
            # Short answer keyword matching
            key_words = [w.lower() for w in correct_ans.split() if len(w) > 4]
            matches = sum(1 for w in key_words if w in st_ans.lower())
            is_correct = (matches >= len(key_words) * 0.4) if key_words else (len(st_ans) > 5)

        points = float(q.points) if is_correct else 0.0
        score_obtained += points

        if not is_correct:
            weak_topics.add(assessment.subject_topic)

        sa = StudentAnswer(
            attempt_id=new_attempt.id,
            question_id=q.id,
            student_answer=st_ans,
            is_correct=is_correct,
            points_awarded=points,
            feedback=q.explanation
        )
        db.add(sa)

        question_results.append(QuestionResultOut(
            question_id=q.id,
            question_number=q.question_number,
            question_text=q.question_text,
            question_type=q.question_type,
            options=json.loads(q.options_json) if q.options_json else [],
            student_answer=st_ans,
            correct_answer=q.correct_answer,
            is_correct=is_correct,
            points_awarded=points,
            explanation=q.explanation
        ))

    pct = round((score_obtained / total_possible * 100.0), 1) if total_possible > 0 else 0.0
    is_passed = (pct >= assessment.passing_threshold)

    new_attempt.score_obtained = score_obtained
    new_attempt.total_possible_score = float(total_possible)
    new_attempt.percentage = pct
    new_attempt.is_passed = is_passed
    new_attempt.weak_topics_json = json.dumps(list(weak_topics))

    db.commit()
    db.refresh(new_attempt)

    revision_plan = None
    if not is_passed:
        revision_plan = ai_service.generate_revision_plan(assessment.subject_topic, pct)

    return AttemptResultOut(
        attempt_id=new_attempt.id,
        assessment_id=assessment.id,
        title=assessment.title,
        subject_topic=assessment.subject_topic,
        score_obtained=score_obtained,
        total_possible_score=float(total_possible),
        percentage=pct,
        is_passed=is_passed,
        time_spent_seconds=submission.time_spent_seconds,
        weak_topics=list(weak_topics),
        questions=question_results,
        completed_at=new_attempt.completed_at,
        revision_plan=revision_plan
    )

@router.get("/attempts/{attempt_id}", response_model=AttemptResultOut)
def get_attempt_result(
    attempt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.id == attempt_id,
        AssessmentAttempt.user_id == current_user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt result not found")

    assessment = attempt.assessment
    student_answers = db.query(StudentAnswer).filter(StudentAnswer.attempt_id == attempt.id).all()
    q_results = []
    for sa in student_answers:
        q = sa.question
        q_results.append(QuestionResultOut(
            question_id=q.id,
            question_number=q.question_number,
            question_text=q.question_text,
            question_type=q.question_type,
            options=json.loads(q.options_json) if q.options_json else [],
            student_answer=sa.student_answer,
            correct_answer=q.correct_answer,
            is_correct=sa.is_correct,
            points_awarded=sa.points_awarded,
            explanation=q.explanation
        ))

    weak_list = json.loads(attempt.weak_topics_json) if attempt.weak_topics_json else []
    revision_plan = None
    if not attempt.is_passed and weak_list:
        revision_plan = ai_service.generate_revision_plan(weak_list[0], attempt.percentage)

    return AttemptResultOut(
        attempt_id=attempt.id,
        assessment_id=assessment.id,
        title=assessment.title,
        subject_topic=assessment.subject_topic,
        score_obtained=attempt.score_obtained,
        total_possible_score=attempt.total_possible_score,
        percentage=attempt.percentage,
        is_passed=attempt.is_passed,
        time_spent_seconds=attempt.time_spent_seconds,
        weak_topics=weak_list,
        questions=q_results,
        completed_at=attempt.completed_at,
        revision_plan=revision_plan
    )
