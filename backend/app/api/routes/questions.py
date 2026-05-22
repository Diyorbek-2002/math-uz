from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, Integer
from typing import List, Optional
import anthropic
import os

from app.database import get_db
from app.models.models import Question, Attempt, Analytics, User
from app.schemas.schemas import QuestionOut, AttemptIn, AttemptResult, TopicOut

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("/topics", response_model=List[TopicOut])
def get_topics(db: Session = Depends(get_db)):
    """Barcha mavzularni qaytaradi (nechta savol borligini ham)"""
    rows = (
        db.query(
            Question.topic_code,
            Question.topic,
            func.count(Question.id).label("total"),
            func.sum(Question.is_free.cast(Integer)).label("free_count"),
        )
        .group_by(Question.topic_code, Question.topic)
        .order_by(func.count(Question.id).desc())
        .all()
    )
    return [
        TopicOut(
            topic_code=r.topic_code,
            topic=r.topic,
            total=r.total,
            free_count=r.free_count or 0,
        )
        for r in rows
    ]


@router.get("/{topic_code}", response_model=List[QuestionOut])
def get_questions(
    topic_code: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Mavzu bo'yicha savollarni qaytaradi"""
    q = db.query(Question).filter(Question.topic_code == topic_code)
    if difficulty:
        q = q.filter(Question.difficulty == difficulty)
    questions = q.offset(offset).limit(limit).all()
    if not questions:
        raise HTTPException(status_code=404, detail="Bu mavzuda savollar topilmadi")
    return questions


@router.post("/{question_id}/submit", response_model=AttemptResult)
def submit_answer(
    question_id: int,
    attempt: AttemptIn,
    db: Session = Depends(get_db),
    # user_id: int = Depends(get_current_user),  # Auth qo'shilganda
):
    """Javobni tekshiradi va natijani qaytaradi"""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Savol topilmadi")

    # Javobni tekshirish
    is_correct = False
    correct_answer = question.correct_answer or ""

    if correct_answer:
        # Ma'lumotlar bazasida javob bor
        is_correct = attempt.chosen_answer.upper() == correct_answer.upper()
    else:
        # Claude API orqali tekshirish
        is_correct, correct_answer = check_with_claude(question, attempt.chosen_answer)

    # Tushuntirish olish (ixtiyoriy - xato bo'lsa)
    explanation = None
    if not is_correct:
        explanation = get_explanation(question, correct_answer)

    # Attempt saqlash (user_id hozircha 1 - auth qo'shilganda o'zgaradi)
    new_attempt = Attempt(
        user_id=1,
        question_id=question_id,
        topic_code=question.topic_code,
        chosen_answer=attempt.chosen_answer,
        is_correct=is_correct,
        time_spent=attempt.time_spent,
    )
    db.add(new_attempt)
    db.commit()

    # Analyticsni yangilash
    update_analytics(db, user_id=1, question=question, is_correct=is_correct, time_spent=attempt.time_spent)

    return AttemptResult(
        is_correct=is_correct,
        correct_answer=correct_answer,
        solution=question.solution,
        explanation=explanation,
        time_spent=attempt.time_spent,
    )


def check_with_claude(question, chosen: str) -> tuple[bool, str]:
    """Claude API orqali to'g'ri javobni aniqlash"""
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        answers_text = "\n".join([f"{k}) {v}" for k, v in question.answers.items()])
        prompt = f"""Quyidagi matematika testini yech va faqat to'g'ri javob harfini yoz (A, B, C, D yoki E):

Savol: {question.question_text}

{answers_text}

Faqat bitta harf yoz, boshqa hech narsa yozma."""

        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=10,
            messages=[{"role": "user", "content": prompt}],
        )
        correct = msg.content[0].text.strip().upper()
        if correct not in ["A", "B", "C", "D", "E"]:
            correct = "A"
        return chosen.upper() == correct, correct
    except Exception:
        return False, "?"


def get_explanation(question, correct_answer: str) -> str:
    """Xato javob uchun Claude dan tushuntirish olish"""
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        answers_text = "\n".join([f"{k}) {v}" for k, v in question.answers.items()])
        prompt = f"""Matematika savoli va uning to'g'ri javobini qisqacha o'zbekcha tushuntir (2-3 jumla):

Savol: {question.question_text}
{answers_text}

To'g'ri javob: {correct_answer}) {question.answers.get(correct_answer, '')}

Qisqa, tushunarli tushuntirish ber."""

        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()
    except Exception:
        return f"To'g'ri javob: {correct_answer}"


def update_analytics(db: Session, user_id: int, question, is_correct: bool, time_spent: float):
    """Foydalanuvchi statistikasini yangilash"""
    analytics = db.query(Analytics).filter(
        Analytics.user_id == user_id,
        Analytics.topic_code == question.topic_code,
    ).first()

    if not analytics:
        analytics = Analytics(
            user_id=user_id,
            topic_code=question.topic_code,
            topic_name=question.topic,
            total_attempts=0,
            correct_count=0,
            avg_time=0,
            accuracy=0,
        )
        db.add(analytics)

    # Yangilash
    analytics.total_attempts += 1
    if is_correct:
        analytics.correct_count += 1
    # O'rtacha vaqtni yangilash (rolling average)
    n = analytics.total_attempts
    analytics.avg_time = ((analytics.avg_time * (n - 1)) + time_spent) / n
    analytics.accuracy = (analytics.correct_count / analytics.total_attempts) * 100
    db.commit()
