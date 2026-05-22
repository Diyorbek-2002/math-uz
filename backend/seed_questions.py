"""
questions_final.json faylidan savollarni bazaga yuklash
Ishlatish: python seed_questions.py
"""
import json
import sys
from sqlalchemy.orm import Session

sys.path.append(".")
from app.database import engine, SessionLocal, Base
from app.models.models import Question

def seed():
    # Barcha jadvallarni yaratish
    Base.metadata.create_all(bind=engine)

    with open("questions_final.json", encoding="utf-8") as f:
        questions = json.load(f)

    db: Session = SessionLocal()

    existing = db.query(Question).count()
    if existing > 0:
        print(f"Bazada allaqachon {existing} ta savol bor. O'tkazib yuborildi.")
        db.close()
        return

    batch = []
    for q in questions:
        # Bo'sh savollarni o'tkazib yuborish
        if not q.get("question") or len(q["question"].strip()) < 5:
            continue
        # Javob variantlari bo'sh bo'lmasligi kerak
        answers = q.get("answers", {})
        if len(answers) < 3:
            continue

        batch.append(Question(
            code=q.get("code", f"q{q['id']}"),
            year=q.get("year"),
            topic_code=q.get("topic_code", "other"),
            topic=q.get("topic", "Boshqa"),
            question_text=q["question"],
            answers=answers,
            correct_answer=q.get("correct_answer") or None,
            solution=q.get("solution") or None,
            difficulty=q.get("difficulty", "oson"),
            is_free=q.get("is_free", True),
            page=q.get("page"),
        ))

        # Har 500 tadan batch insert
        if len(batch) >= 500:
            db.bulk_save_objects(batch)
            db.commit()
            print(f"  {db.query(Question).count()} ta saqlandi...")
            batch = []

    # Qolganlarini saqlash
    if batch:
        db.bulk_save_objects(batch)
        db.commit()

    total = db.query(Question).count()
    print(f"\n✅ Jami {total} ta savol bazaga yuklandi!")

    # Statistika
    from sqlalchemy import func
    by_topic = db.query(Question.topic, func.count(Question.id)).group_by(Question.topic).all()
    print("\n📊 Mavzular bo'yicha:")
    for topic, count in sorted(by_topic, key=lambda x: -x[1])[:10]:
        print(f"  {topic}: {count} ta")

    db.close()

if __name__ == "__main__":
    seed()
