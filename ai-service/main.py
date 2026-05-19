"""
AI Microservice for Event Management System
FastAPI-based service providing ML model training and inference for:
- Event Recommendations (Collaborative Filtering)
- Attendance Prediction (Random Forest / Gradient Boosting)
- Sentiment Analysis (NLP with NLTK/TextBlob)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
from models.recommendation import RecommendationEngine
from models.attendance_predictor import AttendancePredictor
from models.sentiment_analyzer import SentimentAnalyzer

app = FastAPI(
    title="EventAI - AI Microservice",
    description="ML models for event management system",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
recommendation_engine = RecommendationEngine()
attendance_predictor = AttendancePredictor()
sentiment_analyzer = SentimentAnalyzer()


# ─── Request Models ────────────────────────────────────────────────

class RecommendationRequest(BaseModel):
    user_id: str
    limit: int = 5
    categories: Optional[list[str]] = None


class AttendancePredictionRequest(BaseModel):
    event_id: str
    category: str
    price: float
    capacity: int
    day_of_week: int  # 0=Monday, 6=Sunday
    is_online: bool
    historical_events: Optional[int] = None


class SentimentRequest(BaseModel):
    text: str
    event_id: Optional[str] = None


class TrainRequest(BaseModel):
    model_type: str  # "recommendation", "attendance", "sentiment"
    data_path: Optional[str] = None


# ─── Endpoints ─────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "EventAI ML Service",
        "status": "running",
        "models": {
            "recommendation": recommendation_engine.is_trained,
            "attendance": attendance_predictor.is_trained,
            "sentiment": sentiment_analyzer.is_trained,
        },
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/recommendations")
def get_recommendations(request: RecommendationRequest):
    """Get personalized event recommendations for a user."""
    try:
        recommendations = recommendation_engine.predict(
            user_id=request.user_id,
            limit=request.limit,
            categories=request.categories,
        )
        return {
            "user_id": request.user_id,
            "recommendations": recommendations,
            "model": "collaborative-filtering-v1",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict-attendance")
def predict_attendance(request: AttendancePredictionRequest):
    """Predict attendance for an event based on features."""
    try:
        prediction = attendance_predictor.predict(
            category=request.category,
            price=request.price,
            capacity=request.capacity,
            day_of_week=request.day_of_week,
            is_online=request.is_online,
        )
        return {
            "event_id": request.event_id,
            "prediction": prediction,
            "model": "attendance-predictor-v1",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-sentiment")
def analyze_sentiment(request: SentimentRequest):
    """Analyze sentiment of feedback text."""
    try:
        analysis = sentiment_analyzer.analyze(request.text)
        return {
            "event_id": request.event_id,
            "analysis": analysis,
            "model": "sentiment-analyzer-v1",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train")
def train_model(request: TrainRequest):
    """Train or retrain a specific model."""
    try:
        if request.model_type == "recommendation":
            result = recommendation_engine.train()
        elif request.model_type == "attendance":
            result = attendance_predictor.train()
        elif request.model_type == "sentiment":
            result = sentiment_analyzer.train()
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown model type: {request.model_type}",
            )
        return {"model": request.model_type, "result": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
