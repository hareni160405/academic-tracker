from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department: Optional[str] = "Computer Science & Engineering"
    semester: Optional[str] = "Semester 5"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    timezone: Optional[str] = None
    daily_goal_minutes: Optional[int] = None
    passing_threshold: Optional[float] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserOut(BaseModel):
    id: str
    student_id: str
    email: EmailStr
    full_name: str
    department: Optional[str]
    semester: Optional[str]
    timezone: str
    daily_goal_minutes: int
    passing_threshold: float
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    user_id: Optional[str] = None
