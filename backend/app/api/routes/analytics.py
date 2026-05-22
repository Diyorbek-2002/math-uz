from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import anthropic, os

from app.database import get_db
from app.models.models import Analytics, Attempt
from app.schemas.schemas import AnalyticsOut, UserStatsOut, TopicSummary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/me", response_model=UserStatsOut)
def get_my_stats(
    db: Session = Depends(get_db),
    # user_id: int = Depends(get_current_user),
    user_id: int = 1,
):
    """Foydalanuvchining umumiy statistikasi"""
    all_analytics = db.query(Analytics).filter(Analytics.user_id == user_id).all()

    if not all_analytics:
        raise HTTPException(status_code=404, detail="Hali hech qanday statistika yo'q")

    total_attempts = sum(a.total_attempts for a in all_analytics)
    total_correct = sum(a.correct_count for a in all_analytics)
    overall_accuracy = (total_correct / total_attempts * 100) if total_attempts else 0
    avg_time = sum(a.avg_time * a.total_attempts for a in all_analytics) / total_attempts if total_attempts else 0

    topic_stats = [
        TopicSummary(
            topic_code=a.topic_code,
            topic_name=a.topic_name,
            accuracy=round(a.accuracy, 1),
            total_attempts=a.total_attempts,
            avg_time=round(a.avg_time, 1),
        )
        for a in all_analytics
    ]

    sorted_topics = sorted(topic_stats, key=lambda x: x.accuracy)
    weakest = sorted_topics[0].topic_name if sorted_topics else None
    strongest = sorted_topics[-1].topic_name if sorted_topics else None

    return UserStatsOut(
        total_attempts=total_attempts,
        overall_accuracy=round(overall_accuracy, 1),
        topics_studied=len(all_analytics),
        avg_time_per_question=round(avg_time, 1),
        topic_stats=topic_stats,
        weakest_topic=weakest,
        strongest_topic=strongest,
    )


@router.get("/topic/{topic_code}", response_model=AnalyticsOut)
def get_topic_analytics(
    topic_code: str,
    db: Session = Depends(get_db),
    user_id: int = 1,
):
    """Bitta mavzu bo'yicha batafsil statistika"""
    analytics = db.query(Analytics).filter(
        Analytics.user_id == user_id,
        Analytics.topic_code == topic_code,
    ).first()

    if not analytics:
        raise HTTPException(status_code=404, detail="Bu mavzu bo'yicha hali statistika yo'q")

    return analytics


@router.get("/ai-feedback")
def get_ai_feedback(
    db: Session = Depends(get_db),
    user_id: int = 1,
):
    """Claude API orqali shaxsiy tavsiya olish"""
    all_analytics = db.query(Analytics).filter(Analytics.user_id == user_id).all()
    if not all_analytics:
        return {"feedback": "Hali ma'lumot yo'q. Bir nechta savol yeching!"}

    # Statistikani tayyorlash
    stats_text = "\n".join([
        f"- {a.topic_name}: {a.accuracy:.0f}% to'g'ri, {a.total_attempts} ta savol, o'rtacha {a.avg_time:.0f}s"
        for a in sorted(all_analytics, key=lambda x: x.accuracy)
    ])

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": f"""O'quvchining matematika statistikasi:
{stats_text}

Ushbu statistikaga qarab o'zbekcha 3-4 jumlada:
1. Eng zaif mavzuni belgilab, nima qilish kerakligini ayting
2. Eng kuchli tomonni maqtang
3. Keyingi mashg'ulot uchun konkret tavsiya bering"""
            }],
        )
        return {"feedback": msg.content[0].text.strip()}
    except Exception as e:
        return {"feedback": "Tavsiya olishda xatolik yuz berdi. Keyinroq urinib ko'ring."}
