"""ML and AI endpoints"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Message, MessageML
from app.services.ml_processor import get_ml_processor

router = APIRouter()


class MLProcessRequest(BaseModel):
    message_id: str


class MLProcessResponse(BaseModel):
    message_id: str
    summary_short: Optional[str] = None
    priority_score: Optional[float] = None
    priority_label: Optional[str] = None
    tone_label: Optional[str] = None
    intent_label: Optional[str] = None
    phishing_score: Optional[float] = None
    pii_count: int = 0


class SmartReplyRequest(BaseModel):
    message_id: str
    tone: Optional[str] = 'professional'  # professional, casual, brief
    num_suggestions: Optional[int] = 3


class ReplyOption(BaseModel):
    label: str
    text: str


class SmartReplyResponse(BaseModel):
    message_id: str
    suggestions: List[ReplyOption]


@router.post("/process-message", response_model=MLProcessResponse)
async def process_message_ml(
    request: MLProcessRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Process a single message with AI/ML"""
    try:
        # Get message - convert string ID to integer
        result = await db.execute(
            select(Message).where(Message.id == int(request.message_id))
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Process with ML
        ml_processor = get_ml_processor()
        ml_data = await ml_processor.process_message({
            'subject': message.subject,
            'body_text': message.body_text,
            'from_email': message.from_email
        })
        
        # Check if ML record exists
        ml_result = await db.execute(
            select(MessageML).where(MessageML.message_id == message.id)
        )
        ml_record = ml_result.scalar_one_or_none()
        
        if ml_record:
            # Update existing
            ml_record.summary_short = ml_data.get('summary_short')
            ml_record.priority_score = ml_data.get('priority_score')
            ml_record.priority_label = ml_data.get('priority_label')
            ml_record.tone_label = ml_data.get('tone_label')
            ml_record.intent_label = ml_data.get('intent_label')
            ml_record.phishing_score = ml_data.get('phishing_score')
            ml_record.pii_entities = ml_data.get('pii_entities', [])
        else:
            # Create new
            ml_record = MessageML(
                message_id=message.id,
                summary_short=ml_data.get('summary_short'),
                priority_score=ml_data.get('priority_score'),
                priority_label=ml_data.get('priority_label'),
                tone_label=ml_data.get('tone_label'),
                intent_label=ml_data.get('intent_label'),
                phishing_score=ml_data.get('phishing_score'),
                pii_entities=ml_data.get('pii_entities', []),
                model_version='v1.0'
            )
            db.add(ml_record)
        
        await db.commit()
        
        return MLProcessResponse(
            message_id=str(message.id),
            summary_short=ml_data.get('summary_short'),
            priority_score=ml_data.get('priority_score'),
            priority_label=ml_data.get('priority_label'),
            tone_label=ml_data.get('tone_label'),
            intent_label=ml_data.get('intent_label'),
            phishing_score=ml_data.get('phishing_score'),
            pii_count=len(ml_data.get('pii_entities', []))
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML processing failed: {str(e)}")


@router.post("/batch-process")
async def batch_process_messages(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Process multiple unprocessed messages with AI/ML"""
    try:
        # Get user's account
        account_id = current_user.get('account_id')
        
        # Get unprocessed messages
        result = await db.execute(
            select(Message)
            .where(Message.account_id == account_id)
            .outerjoin(MessageML, Message.id == MessageML.message_id)
            .where(MessageML.id == None)
            .limit(limit)
        )
        messages = result.scalars().all()
        
        ml_processor = get_ml_processor()
        processed_count = 0
        
        for message in messages:
            try:
                ml_data = await ml_processor.process_message({
                    'subject': message.subject,
                    'body_text': message.body_text,
                    'from_email': message.from_email
                })
                
                ml_record = MessageML(
                    message_id=message.id,
                    summary_short=ml_data.get('summary_short'),
                    priority_score=ml_data.get('priority_score'),
                    priority_label=ml_data.get('priority_label'),
                    tone_label=ml_data.get('tone_label'),
                    intent_label=ml_data.get('intent_label'),
                    phishing_score=ml_data.get('phishing_score'),
                    pii_entities=ml_data.get('pii_entities', []),
                    model_version='v1.0'
                )
                db.add(ml_record)
                processed_count += 1
                
            except Exception as e:
                logger.error(f"Failed to process message {message.id}: {e}")
                continue
        
        await db.commit()
        
        return {
            "status": "success",
            "processed": processed_count,
            "total": len(messages)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")


@router.get("/stats")
async def get_ml_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get ML processing statistics"""
    try:
        account_id = current_user.get('account_id')
        
        # Count total messages
        total_result = await db.execute(
            select(Message).where(Message.account_id == account_id)
        )
        total_messages = len(total_result.scalars().all())
        
        # Count processed messages
        processed_result = await db.execute(
            select(MessageML)
            .join(Message, MessageML.message_id == Message.id)
            .where(Message.account_id == account_id)
        )
        processed_messages = len(processed_result.scalars().all())
        
        # Count high priority
        high_priority_result = await db.execute(
            select(MessageML)
            .join(Message, MessageML.message_id == Message.id)
            .where(Message.account_id == account_id)
            .where(MessageML.priority_label == 'high')
        )
        high_priority = len(high_priority_result.scalars().all())
        
        # Count phishing threats
        phishing_result = await db.execute(
            select(MessageML)
            .join(Message, MessageML.message_id == Message.id)
            .where(Message.account_id == account_id)
            .where(MessageML.phishing_score > 0.5)
        )
        phishing_count = len(phishing_result.scalars().all())
        
        return {
            "total_messages": total_messages,
            "processed_messages": processed_messages,
            "unprocessed_messages": total_messages - processed_messages,
            "high_priority_count": high_priority,
            "phishing_threats": phishing_count,
            "processing_rate": round(processed_messages / total_messages * 100, 1) if total_messages > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/smart-replies", response_model=SmartReplyResponse)
async def generate_smart_replies(
    request: SmartReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate smart reply suggestions for a message"""
    try:
        # Get message - convert string ID to integer
        result = await db.execute(
            select(Message).where(Message.id == int(request.message_id))
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Generate smart replies
        ml_processor = get_ml_processor()
        suggestions = await ml_processor.generate_smart_replies(
            subject=message.subject,
            body=message.body_text,
            tone=request.tone,
            num_suggestions=request.num_suggestions
        )
        
        return {
            "message_id": request.message_id,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate replies: {str(e)}")
