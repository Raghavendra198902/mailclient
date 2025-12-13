"""AI/ML service endpoints"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.ai.summarizer import summarizer_service
from app.services.ai.smart_reply import smart_reply_service
from app.services.ai.tone_detector import tone_detector_service
from app.services.ai.intent_classifier import intent_classifier_service

router = APIRouter()


class SummarizeRequest(BaseModel):
    text: str
    summary_type: str = "short"  # short, long, actionable


class SummarizeResponse(BaseModel):
    summary: str
    summary_type: str


class SmartReplyRequest(BaseModel):
    text: str
    context: Optional[str] = None
    tone: str = "professional"  # professional, casual, friendly


class SmartReplyResponse(BaseModel):
    replies: List[str]


class ToneRequest(BaseModel):
    text: str


class ToneResponse(BaseModel):
    tone: str  # anger, joy, neutral, urgency
    confidence: float


class IntentRequest(BaseModel):
    text: str


class IntentResponse(BaseModel):
    intent: str  # approve, reject, escalate, schedule_meeting, info_request
    confidence: float


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(
    request: SummarizeRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate AI summary of text"""
    try:
        summary = await summarizer_service.summarize(
            request.text,
            summary_type=request.summary_type
        )
        return SummarizeResponse(
            summary=summary,
            summary_type=request.summary_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.post("/smart-reply", response_model=SmartReplyResponse)
async def generate_smart_reply(
    request: SmartReplyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate smart reply suggestions"""
    try:
        replies = await smart_reply_service.generate_replies(
            request.text,
            context=request.context,
            tone=request.tone
        )
        return SmartReplyResponse(replies=replies)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reply generation failed: {str(e)}")


@router.post("/tone", response_model=ToneResponse)
async def detect_tone(
    request: ToneRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Detect tone of text"""
    try:
        result = await tone_detector_service.detect(request.text)
        return ToneResponse(
            tone=result["tone"],
            confidence=result["confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tone detection failed: {str(e)}")


@router.post("/intent", response_model=IntentResponse)
async def extract_intent(
    request: IntentRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Extract intent from text"""
    try:
        result = await intent_classifier_service.classify(request.text)
        return IntentResponse(
            intent=result["intent"],
            confidence=result["confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intent extraction failed: {str(e)}")


@router.get("/inbox-health")
async def get_inbox_health(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get inbox health metrics"""
    # Placeholder - implement actual health calculation
    return {
        "score": 75.5,
        "breakdown": {
            "unread_ratio": 0.3,
            "response_time_avg": 4.2,
            "high_priority_pending": 5,
            "phishing_detected": 2
        }
    }


@router.get("/relationship-graph")
async def get_relationship_graph(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get contact relationship graph"""
    # Placeholder - implement actual graph generation
    return {
        "nodes": [
            {"id": "1", "email": "john@example.com", "rank": 0.9},
            {"id": "2", "email": "jane@example.com", "rank": 0.85}
        ],
        "edges": [
            {"source": "1", "target": "2", "weight": 15}
        ]
    }
