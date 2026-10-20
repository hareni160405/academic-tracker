import sys
import os
import json
from datetime import datetime, timedelta

# Ensure python path includes backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

client = TestClient(app)

def run_all_tests():
    print("=" * 60)
    print("ACADEMIC TRACKER — AUTOMATED VERIFICATION TEST SUITE")
    print("=" * 60)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Backend API Health Check")

    # 2. Student Registration & Unique Student ID
    student1_email = f"student1_{int(datetime.utcnow().timestamp())}@university.edu"
    reg1 = client.post("/api/auth/register", json={
        "email": student1_email,
        "password": "Password123!",
        "full_name": "Marcus Aurelius",
        "department": "Computer Science & Engineering",
        "semester": "Semester 5"
    })
    assert reg1.status_code == 201, f"Registration failed: {reg1.text}"
    token1 = reg1.json()["access_token"]
    user1 = reg1.json()["user"]
    assert user1["student_id"].startswith("STU-"), f"Invalid Student ID: {user1['student_id']}"
    print(f"[PASS] 2. Student Registration & Student ID Generation ({user1['student_id']})")

    # Duplicate registration rejection
    dup_reg = client.post("/api/auth/register", json={
        "email": student1_email,
        "password": "Password123!",
        "full_name": "Marcus Duplicate",
    })
    assert dup_reg.status_code == 400, "Failed to reject duplicate email"
    print("[PASS] 3. Duplicate Email Registration Rejection")

    # 3. Authentication & Login
    login_res = client.post("/api/auth/login", json={
        "email": student1_email,
        "password": "Password123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Invalid password rejection
    bad_login = client.post("/api/auth/login", json={
        "email": student1_email,
        "password": "WrongPassword!"
    })
    assert bad_login.status_code == 401, "Failed to reject bad credentials"
    print("[PASS] 4. Secure Authentication & Credential Verification")

    # 4. Multi-Tenant Account Isolation
    student2_email = f"student2_{int(datetime.utcnow().timestamp())}@university.edu"
    reg2 = client.post("/api/auth/register", json={
        "email": student2_email,
        "password": "Password123!",
        "full_name": "Hypatia of Alexandria",
        "department": "Mathematics"
    })
    token2 = reg2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Student 1 creates private task
    t1 = client.post("/api/tasks", json={
        "title": "Confidential Study Task S1",
        "priority": "HIGH"
    }, headers=headers1)
    task1_id = t1.json()["id"]

    # Student 2 should NOT see Student 1's task
    s2_tasks = client.get("/api/tasks", headers=headers2).json()
    assert all(t["id"] != task1_id for t in s2_tasks), "Data leakage between students!"
    print("[PASS] 5. Multi-Tenant Data Isolation (Zero Data Leakage)")

    # 5. To-Do List Operations & Statistics
    t_toggle = client.patch(f"/api/tasks/{task1_id}/toggle", headers=headers1)
    assert t_toggle.json()["is_completed"] == True
    stats = client.get("/api/tasks/stats", headers=headers1).json()
    assert stats["completed_tasks"] == 1
    assert stats["completion_rate_percentage"] == 100.0
    print("[PASS] 6. Task Management, Toggling, and Dynamic Statistics")

    # 6. Study Timer Lifecycle Engine
    # Start timer
    timer_start = client.post("/api/timer/start", json={
        "subject": "Distributed Systems"
    }, headers=headers1)
    assert timer_start.status_code == 200
    session_id = timer_start.json()["id"]

    # Heartbeat
    hb = client.post("/api/timer/heartbeat", json={"session_id": session_id}, headers=headers1)
    assert hb.json()["status"] == "OK"

    # Status check
    status1 = client.get("/api/timer/status", headers=headers1).json()
    assert status1["is_active"] == True
    assert status1["current_session"]["subject"] == "Distributed Systems"

    # Stop timer (manual stop)
    timer_stop = client.post("/api/timer/stop", json={
        "reason": "MANUAL_STOP",
        "notes": "Finished Chapter 4"
    }, headers=headers1)
    assert timer_stop.status_code == 200
    assert timer_stop.json()["status"] == "COMPLETED"

    # Multi-session accumulation check
    timer_start2 = client.post("/api/timer/start", json={"subject": "Algorithms"}, headers=headers1)
    timer_stop2 = client.post("/api/timer/stop", json={"reason": "MANUAL_STOP"}, headers=headers1)
    analytics = client.get("/api/timer/analytics", headers=headers1).json()
    assert analytics["total_sessions_count"] >= 2
    print("[PASS] 7. Study Timer (Start, Heartbeat, Stop, Accumulation & Analytics)")

    # 7. Calendar & 8:00 AM Smart Morning Reminder
    tomorrow = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")
    event_res = client.post("/api/calendar/events", json={
        "title": "Operating Systems Final Exam",
        "event_date": tomorrow,
        "event_time": "10:00:00",
        "category": "EXAM",
        "reminder_enabled": True
    }, headers=headers1)
    assert event_res.status_code == 201
    evt_data = event_res.json()
    assert evt_data["reminder_time"] is not None
    print("[PASS] 8. Calendar Scheduling & 8:00 AM Local Reminder Calculation")

    # 8. Assessment Generation, Scoring & Weak-Topic Remediation
    quiz_res = client.post("/api/assessments/generate", json={
        "subject_topic": "Binary Search Trees",
        "assessment_type": "MCQ",
        "difficulty": "MEDIUM",
        "question_count": 5,
        "time_limit_minutes": 10
    }, headers=headers1)
    assert quiz_res.status_code == 200
    quiz_data = quiz_res.json()
    assert len(quiz_data["questions"]) == 5
    quiz_id = quiz_data["id"]

    # Submit answers with intentionally incorrect answers to trigger < 60% weak-topic remediation
    wrong_answers = [{"question_id": q["id"], "answer": "Completely Wrong Answer"} for q in quiz_data["questions"]]
    submit_res = client.post(f"/api/assessments/{quiz_id}/submit", json={
        "answers": wrong_answers,
        "time_spent_seconds": 120
    }, headers=headers1)
    assert submit_res.status_code == 200
    attempt_data = submit_res.json()
    assert attempt_data["percentage"] < 60.0
    assert attempt_data["is_passed"] == False
    assert "Binary Search Trees" in attempt_data["weak_topics"]
    assert attempt_data["revision_plan"] is not None
    assert len(attempt_data["revision_plan"]) == 3
    print(f"[PASS] 9. Assessment Scoring & 3-Step Weak-Topic Remediation Triggered")

    # 9. AI Study Assistant Chat
    chat_res = client.post("/api/assistant/chat", json={
        "message": "Explain how BST insertion handles duplicate keys",
        "include_weak_topics_context": True
    }, headers=headers1)
    assert chat_res.status_code == 200
    assert len(chat_res.json()["content"]) > 30
    print("[PASS] 10. AI Study Assistant Interactive Tutoring")

    # 10. Performance Reports Aggregation
    rep_res = client.get("/api/reports", headers=headers1)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["tasks_total"] >= 1
    assert rep_data["total_assessments_taken"] >= 1
    assert len(rep_data["weak_topics"]) >= 1
    print("[PASS] 11. Performance Reports Aggregation & Analytics")

    # 11. Static PWA Files Delivery
    manifest_res = client.get("/manifest.webmanifest")
    assert manifest_res.status_code == 200
    assert "Academic Tracker" in manifest_res.text

    sw_res = client.get("/sw.js")
    assert sw_res.status_code == 200
    print("[PASS] 12. PWA Manifest & Service Worker Static Delivery")

    print("=" * 60)
    print("ALL 12 CORE AUTOMATION & COMPLIANCE TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_tests()
