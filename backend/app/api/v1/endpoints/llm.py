"""
LLM API endpoints for advanced AI features
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.llm_service import llm_service, LLMProvider
from app.models.models import Message

router = APIRouter()


class GenerateTextRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    provider: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 500


class GenerateTextResponse(BaseModel):
    text: str
    provider: str


class EmailDraftRequest(BaseModel):
    context: str
    purpose: str
    tone: str = "professional"


class EmailDraftResponse(BaseModel):
    subject: str
    body: str


class ConversationAnalysisRequest(BaseModel):
    message_ids: List[int]


class ConversationAnalysisResponse(BaseModel):
    summary: str
    topics: List[str]
    action_items: List[str]
    sentiment: str


@router.post("/generate", response_model=GenerateTextResponse)
async def generate_text(
    request: GenerateTextRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate text using LLM
    
    Supports multiple providers: openai, anthropic, google, local
    """
    try:
        provider = None
        if request.provider:
            try:
                provider = LLMProvider(request.provider)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid provider: {request.provider}")
        
        text = await llm_service.generate_completion(
            prompt=request.prompt,
            system_prompt=request.system_prompt,
            provider=provider,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        return GenerateTextResponse(
            text=text,
            provider=str(llm_service.default_provider)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/draft-email", response_model=EmailDraftResponse)
async def draft_email(
    request: EmailDraftRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a complete email draft using LLM
    
    Provide context and purpose, get a full email with subject and body
    """
    try:
        draft = await llm_service.generate_email_draft(
            context=request.context,
            purpose=request.purpose,
            tone=request.tone
        )
        
        # Parse subject and body
        lines = draft.split('\n')
        subject = ""
        body = ""
        
        for i, line in enumerate(lines):
            if line.lower().startswith('subject:'):
                subject = line.split(':', 1)[1].strip()
            elif subject and not body:
                # Start of body
                body = '\n'.join(lines[i:]).strip()
                break
        
        if not subject:
            # If no subject found, use first line
            subject = lines[0] if lines else "Email"
            body = '\n'.join(lines[1:]).strip() if len(lines) > 1 else draft
        
        return EmailDraftResponse(subject=subject, body=body)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-conversation", response_model=ConversationAnalysisResponse)
async def analyze_conversation(
    request: ConversationAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze an email conversation thread
    
    Provides summary, key topics, action items, and sentiment analysis
    """
    try:
        from sqlalchemy import select
        
        # Fetch messages
        result = await db.execute(
            select(Message).where(
                Message.id.in_(request.message_ids),
                Message.account_id == current_user['account_id']
            ).order_by(Message.received_date)
        )
        messages = result.scalars().all()
        
        if not messages:
            raise HTTPException(status_code=404, detail="Messages not found")
        
        # Format messages for analysis
        message_list = [
            {
                'from_email': msg.from_email,
                'date': str(msg.received_date),
                'subject': msg.subject,
                'body': msg.body_text or msg.body_html[:500]
            }
            for msg in messages
        ]
        
        # Analyze conversation
        analysis = await llm_service.analyze_conversation(message_list)
        
        return ConversationAnalysisResponse(
            summary=analysis.get('summary', 'No summary available'),
            topics=analysis.get('topics', []),
            action_items=analysis.get('action_items', []),
            sentiment=analysis.get('sentiment', 'neutral')
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-entities/{message_id}")
async def extract_entities(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Extract named entities from an email message
    
    Extracts: people, organizations, dates, locations, emails, phones
    """
    try:
        from sqlalchemy import select
        
        # Fetch message
        result = await db.execute(
            select(Message).where(
                Message.id == message_id,
                Message.account_id == current_user['account_id']
            )
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Extract entities
        text = f"{message.subject}\n\n{message.body_text or message.body_html}"
        entities = await llm_service.extract_entities(text)
        
        return entities
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers")
async def get_available_providers(
    current_user: dict = Depends(get_current_user)
):
    """
    Get list of available LLM providers
    """
    return {
        "default_provider": str(llm_service.default_provider) if llm_service.default_provider else None,
        "available_providers": [str(p) for p in llm_service.providers.keys()],
        "providers": {
            "openai": {
                "available": LLMProvider.OPENAI in llm_service.providers,
                "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
            },
            "anthropic": {
                "available": LLMProvider.ANTHROPIC in llm_service.providers,
                "models": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"]
            },
            "google": {
                "available": LLMProvider.GOOGLE in llm_service.providers,
                "models": ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"]
            },
            "local": {
                "available": LLMProvider.LOCAL in llm_service.providers,
                "models": ["llama3.2", "llama3.1", "mistral", "phi3", "gemma2"]
            }
        }
    }


@router.post("/rewrite-email/{message_id}")
async def rewrite_email(
    message_id: int,
    tone: str = "professional",
    style: str = "concise",
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Rewrite an email in a different tone or style
    
    Tones: professional, casual, friendly, formal
    Styles: concise, detailed, persuasive
    """
    try:
        from sqlalchemy import select
        
        # Fetch message
        result = await db.execute(
            select(Message).where(
                Message.id == message_id,
                Message.account_id == current_user['account_id']
            )
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Rewrite email
        system_prompt = f"You are an expert email writer. Rewrite emails in a {tone} tone with a {style} style."
        prompt = f"""Rewrite this email:

Subject: {message.subject}
Body: {message.body_text or message.body_html[:1000]}

Make it {tone} and {style}."""
        
        rewritten = await llm_service.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=600
        )
        
        return {
            "original_subject": message.subject,
            "original_body": message.body_text or message.body_html,
            "rewritten": rewritten,
            "tone": tone,
            "style": style
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
