from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.core.database import get_db
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut, TaskStats
from app.api.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["To-Do List"])

@router.get("", response_model=List[TaskOut])
def get_tasks(
    filter_by: Optional[str] = Query("all", regex="^(all|today|upcoming|completed|pending)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    today = date.today()

    if filter_by == "completed":
        query = query.filter(Task.is_completed == True)
    elif filter_by == "pending":
        query = query.filter(Task.is_completed == False)
    elif filter_by == "today":
        # Tasks due today or completed today
        query = query.filter(
            (Task.due_date >= datetime.combine(today, datetime.min.time())) &
            (Task.due_date <= datetime.combine(today, datetime.max.time()))
        )
    elif filter_by == "upcoming":
        query = query.filter(
            Task.is_completed == False,
            Task.due_date > datetime.combine(today, datetime.max.time())
        )

    return query.order_by(Task.is_completed.asc(), Task.due_date.asc().nullslast(), Task.created_at.desc()).all()

@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = Task(
        user_id=current_user.id,
        title=task_in.title.strip(),
        description=task_in.description,
        priority=task_in.priority or "MEDIUM",
        category=task_in.category or "General",
        due_date=task_in.due_date
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/stats", response_model=TaskStats)
def get_task_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    all_tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.is_completed)
    pending = total - completed
    
    today = date.today()
    today_pending = sum(
        1 for t in all_tasks 
        if not t.is_completed and t.due_date and t.due_date.date() == today
    )
    rate = (completed / total * 100.0) if total > 0 else 0.0

    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "today_pending": today_pending,
        "completion_rate_percentage": round(rate, 1)
    }

@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_in.title is not None:
        task.title = task_in.title.strip()
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.priority is not None:
        task.priority = task_in.priority
    if task_in.category is not None:
        task.category = task_in.category
    if task_in.due_date is not None:
        task.due_date = task_in.due_date
    if task_in.is_completed is not None:
        task.is_completed = task_in.is_completed
        task.completed_at = datetime.utcnow() if task_in.is_completed else None

    db.commit()
    db.refresh(task)
    return task

@router.patch("/{task_id}/toggle", response_model=TaskOut)
def toggle_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.is_completed = not task.is_completed
    task.completed_at = datetime.utcnow() if task.is_completed else None
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
