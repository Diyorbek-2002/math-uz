from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api.routes import questions, analytics

# Jadvallarni avtomatik yaratish
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Math.uz API",
    description="O'zbek matematika o'quv platformasi",
    version="1.0.0",
)

# CORS - React frontend bilan ishlash uchun
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://math-uz.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routelarni ulash
app.include_router(questions.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "Math.uz API",
        "version": "1.0.0",
        "status": "ishlayapti",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
