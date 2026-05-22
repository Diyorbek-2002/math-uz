from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    hashed_password = Column(String(200), nullable=False)
    is_premium = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    attempts = relationship("Attempt", back_populates="user")
    analytics = relationship("Analytics", back_populates="user")
    subscription = relationship("Subscription", back_populates="user", uselist=False)


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), index=True)
    year = Column(Integer, nullable=True)
    topic_code = Column(String(20), index=True)
    topic = Column(String(100))
    question_text = Column(Text, nullable=False)
    answers = Column(JSON)           # {"A": "...", "B": "...", ...}
    correct_answer = Column(String(1), nullable=True)
    solution = Column(Text, nullable=True)
    difficulty = Column(String(20), default="oson")  # oson, o'rta, qiyin
    is_free = Column(Boolean, default=True)
    page = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    attempts = relationship("Attempt", back_populates="question")


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    topic_code = Column(String(20))
    chosen_answer = Column(String(1), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_spent = Column(Float, default=0)   # soniyalarda
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_code = Column(String(20), index=True)
    topic_name = Column(String(100))
    total_attempts = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    avg_time = Column(Float, default=0)         # soniyalarda
    accuracy = Column(Float, default=0)          # 0-100 foiz
    weak_subtopics = Column(JSON, default=list)  # zaif mavzular ro'yxati
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="analytics")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan = Column(String(20), default="monthly")  # monthly, yearly
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    payment_ref = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="subscription")
