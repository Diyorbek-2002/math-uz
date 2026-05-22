from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.api.routes import questions, analytics
from app.models.models import Question
import json, os

# Jadvallarni avtomatik yaratish
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Math.uz API",
    description="O'zbek matematika o'quv platformasi",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routelar
app.include_router(questions.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


def seed_on_startup():
    """Agar baza bo'sh bo'lsa, savollarni avtomatik yuklash"""
    db = SessionLocal()
    try:
        count = db.query(Question).count()
        if count > 0:
            print(f"Bazada {count} ta savol bor, seed o'tkazib yuborildi.")
            return

        json_path = os.path.join(os.path.dirname(__file__), "questions_final.json")
        if not os.path.exists(json_path):
            print("questions_final.json topilmadi!")
            return

        print("Savollar yuklanmoqda...")
        with open(json_path, encoding="utf-8") as f:
            qs = json.load(f)

        batch = []
        for q in qs:
            if not q.get("question") or len(q["question"].strip()) < 5:
                continue
            if len(q.get("answers", {})) < 3:
                continue
            batch.append(Question(
                code=q.get("code", f"q{q['id']}"),
                year=q.get("year"),
                topic_code=q.get("topic_code", "other"),
                topic=q.get("topic", "Boshqa"),
                question_text=q["question"],
                answers=q.get("answers", {}),
                correct_answer=q.get("correct_answer") or None,
                solution=q.get("solution") or None,
                difficulty=q.get("difficulty", "oson"),
                is_free=q.get("is_free", True),
                page=q.get("page"),
            ))
            if len(batch) >= 500:
                db.bulk_save_objects(batch)
                db.commit()
                batch = []
        if batch:
            db.bulk_save_objects(batch)
            db.commit()

        total = db.query(Question).count()
        print(f"✅ {total} ta savol yuklandi!")
    except Exception as e:
        print(f"Seed xatosi: {e}")
    finally:
        db.close()


# Startup da seed qilish
seed_on_startup()


@app.get("/")
def root():
    return {"name": "Math.uz API", "version": "1.0.0", "status": "ishlayapti"}

@app.get("/health")
def health():
    db = SessionLocal()
    count = db.query(Question).count()
    db.close()
    return {"status": "ok", "questions": count}
