from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
from datetime import datetime


# ── Questions ───────────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: int
    code: str
    topic_code: str
    topic: str
    question_text: str
    answers: Dict[str, str]
    difficulty: str
    is_free: bool

    class Config:
        from_attributes = True


class QuestionWithAnswer(QuestionOut):
    correct_answer: Optional[str]
    solution: Optional[str]


# ── Topics ───────────────────────────────────────────────────────────────────

class TopicOut(BaseModel):
    topic_code: str
    topic: str
    total: int
    free_count: int


# ── Attempts ────────────────────────────────────────────────────────────────

class AttemptIn(BaseModel):
    question_id: int
    chosen_answer: str
    time_spent: float


class AttemptResult(BaseModel):
    is_correct: bool
    correct_answer: str
    solution: Optional[str]
    explanation: Optional[str]   # Claude API dan keladi
    time_spent: float


# ── Analytics ────────────────────────────────────────────────────────────────

class AnalyticsOut(BaseModel):
    topic_code: str
    topic_name: str
    total_attempts: int
    correct_count: int
    avg_time: float
    accuracy: float
    weak_subtopics: List[str]

    class Config:
        from_attributes = True


class TopicSummary(BaseModel):
    topic_code: str
    topic_name: str
    accuracy: float
    total_attempts: int
    avg_time: float


class UserStatsOut(BaseModel):
    total_attempts: int
    overall_accuracy: float
    topics_studied: int
    avg_time_per_question: float
    topic_stats: List[TopicSummary]
    weakest_topic: Optional[str]
    strongest_topic: Optional[str]


# ── Auth ────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_premium: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
