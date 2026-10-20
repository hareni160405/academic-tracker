import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudyMaterial(Base):
    __tablename__ = "study_materials"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    file_type = Column(String, default="PDF")  # PDF, TXT
    file_size = Column(Integer, default=0)
    extracted_content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="study_materials")
    assessments = relationship("Assessment", back_populates="material")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    material_id = Column(String, ForeignKey("study_materials.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    subject_topic = Column(String, nullable=False)
    assessment_type = Column(String, default="MCQ")  # MCQ, TRUE_FALSE, SHORT_ANSWER, PRACTICE_TEST
    difficulty = Column(String, default="MEDIUM")   # EASY, MEDIUM, HARD
    time_limit_minutes = Column(Integer, default=10) # 0 for untimed
    passing_threshold = Column(Float, default=60.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="assessments")
    material = relationship("StudyMaterial", back_populates="assessments")
    questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String, default="MCQ") # MCQ, TRUE_FALSE, SHORT_ANSWER
    options_json = Column(Text, nullable=True)     # JSON encoded list of option strings
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    points = Column(Integer, default=1)

    assessment = relationship("Assessment", back_populates="questions")
    answers = relationship("StudentAnswer", back_populates="question", cascade="all, delete-orphan")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String, ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, default=1)
    score_obtained = Column(Float, default=0.0)
    total_possible_score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    is_passed = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, default=0)
    weak_topics_json = Column(Text, nullable=True)  # JSON encoded list of weak topics identified
    completed_at = Column(DateTime, default=datetime.utcnow)

    assessment = relationship("Assessment", back_populates="attempts")
    user = relationship("User", back_populates="attempts")
    answers = relationship("StudentAnswer", back_populates="attempt", cascade="all, delete-orphan")


class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String, ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String, ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    student_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    points_awarded = Column(Float, default=0.0)
    feedback = Column(Text, nullable=True)

    attempt = relationship("AssessmentAttempt", back_populates="answers")
    question = relationship("AssessmentQuestion", back_populates="answers")
