"""Message management endpoints"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import logging
from sqlalchemy import and_, or_, func
from email.utils import parsedate_to_datetime

from app.core.database import get_db
from app.core.security import get_current_user, decrypt_password
from app.models.models import Account, Message, MessageML
from app.services.universal_email_service import get_email_service
from app.services.ml_processor import get_ml_processor
from sqlalchemy import select

logger = logging.getLogger(__name__)
router = APIRouter()


class MessageResponse(BaseModel):
    id: str
    subject: str
    from_email: str
    to_email: str
    snippet: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    received_date: str
    is_read: bool
    labels: List[str] = []
    ml_data: Optional[dict] = None  # ML analysis data


class MessageList(BaseModel):
    messages: List[MessageResponse]
    total: int
    folder: str


class MessageCreate(BaseModel):
    to_email: str
    cc_email: Optional[str] = None
    bcc_email: Optional[str] = None
    subject: str
    body: str
    body_html: Optional[str] = None
    attachments: Optional[List[dict]] = None  # [{"filename": "file.pdf", "content": "base64...", "mimetype": "application/pdf"}]
    is_draft: bool = False
    scheduled_time: Optional[datetime] = None


class MessageUpdate(BaseModel):
    is_read: Optional[bool] = None
    labels: Optional[List[str]] = None


class DraftCreate(BaseModel):
    to_email: Optional[str] = None
    cc_email: Optional[str] = None
    bcc_email: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    body_html: Optional[str] = None


class DraftUpdate(BaseModel):
    to_email: Optional[str] = None
    cc_email: Optional[str] = None
    bcc_email: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    body_html: Optional[str] = None


class SearchRequest(BaseModel):
    query: str
    folder: Optional[str] = "inbox"
    from_email: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    has_attachments: Optional[bool] = None
    is_unread: Optional[bool] = None
    labels: Optional[List[str]] = None
    limit: int = 50


@router.get("/", response_model=MessageList)
async def get_messages(
    folder: str = "inbox",
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get user's messages from database"""
    try:
        logger.info(f"Fetching messages for user: {current_user}")
        
        # Get user's primary email account
        account_id = current_user.get("account_id")
        if not account_id:
            logger.error(f"No account_id in token: {current_user}")
            return MessageList(messages=[], total=0, folder=folder)
        
        result = await db.execute(
            select(Account).where(Account.id == account_id)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            return MessageList(messages=[], total=0, folder=folder)
        
        # Query messages
        query = select(Message).where(Message.account_id == account.id)
        
        # Filter by folder/labels using PostgreSQL any() function
        if folder == "inbox":
            query = query.where(Message.labels.any("INBOX"))
        elif folder == "starred":
            query = query.where(Message.labels.any("STARRED"))
        elif folder == "sent":
            query = query.where(Message.labels.any("SENT"))
        elif folder == "trash":
            query = query.where(Message.labels.any("TRASH"))
        
        # Order and paginate
        query = query.order_by(Message.received_date.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        messages = result.scalars().all()
        
        # Get total with efficient count query
        count_query = select(func.count()).select_from(Message).where(Message.account_id == account.id)
        count_result = await db.execute(count_query)
        total = count_result.scalar()
        
        # Fetch all ML data in a single query (optimize N+1 problem)
        message_ids = [msg.id for msg in messages]
        ml_query = select(MessageML).where(MessageML.message_id.in_(message_ids))
        ml_result = await db.execute(ml_query)
        ml_records = ml_result.scalars().all()
        
        # Create a lookup dictionary for ML data
        ml_data_map = {ml.message_id: ml for ml in ml_records}
        
        # Build response with ML data
        response_messages = []
        for msg in messages:
            ml_record = ml_data_map.get(msg.id)
            
            ml_data = None
            if ml_record:
                ml_data = {
                    'summary': ml_record.summary_short,
                    'priority_score': ml_record.priority_score,
                    
                    'sentiment': ml_record.tone_label,
                    'intent': ml_record.intent_label,
                    'phishing_score': ml_record.phishing_score
                }
            
            response_messages.append(MessageResponse(
                id=str(msg.id),
                subject=msg.subject or "(No Subject)",
                from_email=msg.from_email,
                to_email=msg.to_email,
                snippet=msg.body_text[:200] if msg.body_text else "",
                body_text=msg.body_text,
                body_html=msg.body_html,
                received_date=msg.received_date.isoformat(),
                is_read=msg.is_read,
                labels=msg.labels or [],
                ml_data=ml_data
            ))
        
        return MessageList(
            messages=response_messages,
            total=total,
            folder=folder
        )
    except Exception as e:
        logger.exception(f"Failed to fetch messages: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")


@router.post("/sync")
async def sync_messages(
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Trigger email sync from provider"""
    try:
        logger.info(f"Syncing messages for user: {current_user}")
        
        account_id = current_user.get("account_id")
        if not account_id:
            logger.error(f"No account_id in token: {current_user}")
            raise HTTPException(status_code=400, detail="No account found in session")
        
        result = await db.execute(
            select(Account).where(Account.id == account_id)
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(status_code=404, detail="No email account connected")
        
        email_service = get_email_service()
        
        # Determine provider and credentials
        # If account has IMAP credentials, use IMAP provider regardless of provider name
        if account.imap_password and account.imap_server:
            provider_name = "imap"
            credentials = {
                "username": account.email,
                "password": decrypt_password(account.imap_password),
                "imap_server": account.imap_server
            }
        elif account.provider in ["gmail", "outlook"] and account.access_token:
            provider_name = account.provider
            credentials = {
                "access_token": account.access_token,
                "refresh_token": account.refresh_token
            }
        else:
            raise HTTPException(status_code=400, detail="No valid credentials found for account")
        
        # Authenticate and fetch
        provider = email_service.get_provider(provider_name)
        if not provider:
            raise HTTPException(status_code=400, detail=f"Provider {provider_name} not available")
        
        logger.info(f"Using provider: {provider_name}")
        await provider.authenticate(credentials)
        # FULL SYNC: Fetch from all Gmail labels (INBOX, SENT, STARRED, DRAFT, TRASH, SPAM, IMPORTANT, UNREAD, CATEGORY_*)
        # For IMAP, this will fetch from multiple folders
        # Increased to 500 messages per label for comprehensive sync
        messages = await provider.list_messages(max_results=500)
        logger.info(f"Fetched {len(messages)} messages from {provider_name} (full sync across all labels)")
        if messages:
            logger.info(f"First message sample: {messages[0]}")
        
        # Store in database
        synced_count = 0
        for msg_data in messages:
            existing = await db.execute(
                select(Message).where(
                    Message.account_id == account.id,
                    Message.provider_message_id == msg_data.get("id")
                )
            )
            if existing.scalar_one_or_none():
                continue
            
            # Parse email date (RFC 2822 format)
            received_date = datetime.now()
            if msg_data.get("date"):
                try:
                    date_str = msg_data.get("date")
                    if date_str:
                        parsed_date = parsedate_to_datetime(date_str)
                        if parsed_date:
                            received_date = parsed_date
                except (ValueError, TypeError):
                    try:
                        date_str = msg_data.get("date")
                        if date_str:
                            received_date = datetime.fromisoformat(date_str)
                    except:
                        pass
            
            message = Message(
                account_id=account.id,
                provider_message_id=msg_data.get("id"),
                subject=msg_data.get("subject", ""),
                from_email=msg_data.get("from", ""),
                to_email=msg_data.get("to", ""),
                body_text=msg_data.get("body_text", ""),
                body_html=msg_data.get("body_html", ""),
                received_date=received_date,
                is_read=msg_data.get("is_read", False),
                labels=msg_data.get("labels", ["INBOX"])
            )
            db.add(message)
            synced_count += 1
        
        await db.commit()
        
        # Process new messages with ML in background
        if synced_count > 0:
            ml_processor = get_ml_processor()
            result = await db.execute(
                select(Message)
                .where(Message.account_id == account.id)
                .outerjoin(MessageML, Message.id == MessageML.message_id)
                .where(MessageML.id == None)
                .limit(synced_count)
            )
            unprocessed = result.scalars().all()
            
            for message in unprocessed:
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
                        
                        tone_label=ml_data.get('tone_label'),
                        intent_label=ml_data.get('intent_label'),
                        phishing_score=ml_data.get('phishing_score'),
                        pii_entities=ml_data.get('pii_entities', []),
                        model_version='v1.0'
                    )
                    db.add(ml_record)
                except Exception as e:
                    logger.error(f"ML processing failed for message {message.id}: {e}")
            
            await db.commit()
        
        return {
            "status": "success",
            "synced": synced_count,
            "processed": synced_count,
            "message": f"Synced and processed {synced_count} new messages"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.post("/send")
async def send_message(
    message: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Send a new email with support for cc, bcc, attachments, HTML body, drafts, and scheduling"""
    try:
        result = await db.execute(
            select(Account).where(Account.id == current_user.get("account_id"))
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(status_code=404, detail="No email account connected")
        
        # If this is a draft, save it and return
        if message.is_draft:
            draft_message = Message(
                account_id=account.id,
                subject=message.subject,
                from_email=account.email,
                to_email=message.to_email,
                body_text=message.body,
                body_html=message.body_html,
                received_date=datetime.now(),
                is_read=True,
                labels=["DRAFT"]
            )
            db.add(draft_message)
            await db.commit()
            await db.refresh(draft_message)
            return {
                "status": "draft_saved",
                "message": "Draft saved successfully",
                "draft_id": str(draft_message.id)
            }
        
        # If scheduled, save for later sending
        if message.scheduled_time and message.scheduled_time > datetime.now():
            scheduled_message = Message(
                account_id=account.id,
                subject=message.subject,
                from_email=account.email,
                to_email=message.to_email,
                body_text=message.body,
                body_html=message.body_html,
                received_date=message.scheduled_time,
                is_read=True,
                labels=["SCHEDULED"]
            )
            db.add(scheduled_message)
            await db.commit()
            return {
                "status": "scheduled",
                "message": f"Email scheduled for {message.scheduled_time.isoformat()}",
                "scheduled_id": str(scheduled_message.id)
            }
        
        email_service = get_email_service()
        
        if account.provider in ["gmail", "outlook"]:
            credentials = {
                "access_token": account.access_token,
                "refresh_token": account.refresh_token
            }
        else:
            credentials = {
                "username": account.email,
                "password": account.smtp_password or account.imap_password,
                "smtp_server": account.smtp_server
            }
        
        provider = email_service.get_provider(account.provider)
        await provider.authenticate(credentials)
        
        # Send with enhanced parameters
        success = await provider.send_message(
            to=message.to_email,
            subject=message.subject,
            body=message.body,
            cc=message.cc_email,
            bcc=message.bcc_email,
            body_html=message.body_html,
            attachments=message.attachments
        )
        
        if success:
            # Save sent message to database
            sent_message = Message(
                account_id=account.id,
                subject=message.subject,
                from_email=account.email,
                to_email=message.to_email,
                body_text=message.body,
                body_html=message.body_html,
                received_date=datetime.now(),
                is_read=True,
                labels=["SENT"]
            )
            db.add(sent_message)
            await db.commit()
            
            return {
                "status": "success",
                "message": "Email sent successfully",
                "sent_id": str(sent_message.id)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")
            
    except Exception as e:
        logger.error(f"Failed to send message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.patch("/{message_id}")
async def update_message(
    message_id: str,
    update_data: MessageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update message (mark read/unread, add/remove labels)"""
    try:
        result = await db.execute(
            select(Message).where(Message.id == int(message_id))
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if update_data.is_read is not None:
            message.is_read = update_data.is_read
        
        if update_data.labels is not None:
            message.labels = update_data.labels
        
        await db.commit()
        return {"status": "success", "message": "Message updated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update message: {str(e)}")


@router.delete("/{message_id}")
async def delete_message(
    message_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete message (move to trash)"""
    try:
        result = await db.execute(
            select(Message).where(Message.id == int(message_id))
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        if message.labels:
            message.labels = [label for label in message.labels if label != "INBOX"]
            if "TRASH" not in message.labels:
                message.labels.append("TRASH")
        else:
            message.labels = ["TRASH"]
        
        await db.commit()
        return {"status": "success", "message": "Message moved to trash"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete message: {str(e)}")


@router.post("/drafts")
async def save_draft(
    draft: DraftCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Auto-save email draft"""
    try:
        result = await db.execute(
            select(Account).where(Account.id == current_user.get("account_id"))
        )
        account = result.scalar_one_or_none()
        
        if not account:
            raise HTTPException(status_code=404, detail="No email account connected")
        
        draft_message = Message(
            account_id=account.id,
            subject=draft.subject or "",
            from_email=account.email,
            to_email=draft.to_email or "",
            body_text=draft.body or "",
            body_html=draft.body_html,
            received_date=datetime.now(),
            is_read=True,
            labels=["DRAFT"]
        )
        db.add(draft_message)
        await db.commit()
        await db.refresh(draft_message)
        
        return {
            "status": "success",
            "message": "Draft saved",
            "draft_id": str(draft_message.id)
        }
    except Exception as e:
        logger.error(f"Failed to save draft: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save draft: {str(e)}")


@router.patch("/drafts/{draft_id}")
async def update_draft(
    draft_id: int,
    draft: DraftUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update existing draft"""
    try:
        result = await db.execute(
            select(Message).where(
                Message.id == draft_id,
                Message.account_id == current_user.get("account_id")
            )
        )
        message = result.scalar_one_or_none()
        
        if not message or "DRAFT" not in (message.labels or []):
            raise HTTPException(status_code=404, detail="Draft not found")
        
        if draft.to_email is not None:
            message.to_email = draft.to_email
        if draft.subject is not None:
            message.subject = draft.subject
        if draft.body is not None:
            message.body_text = draft.body
        if draft.body_html is not None:
            message.body_html = draft.body_html
        
        await db.commit()
        
        return {"status": "success", "message": "Draft updated"}
    except Exception as e:
        logger.error(f"Failed to update draft: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update draft: {str(e)}")


@router.delete("/drafts/{draft_id}")
async def delete_draft(
    draft_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete draft"""
    try:
        result = await db.execute(
            select(Message).where(
                Message.id == draft_id,
                Message.account_id == current_user.get("account_id")
            )
        )
        message = result.scalar_one_or_none()
        
        if not message or "DRAFT" not in (message.labels or []):
            raise HTTPException(status_code=404, detail="Draft not found")
        
        await db.delete(message)
        await db.commit()
        
        return {"status": "success", "message": "Draft deleted"}
    except Exception as e:
        logger.error(f"Failed to delete draft: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete draft: {str(e)}")


@router.post("/search", response_model=MessageList)
async def search_messages(
    search: SearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Search messages with advanced filters
    
    - Query searches in subject, body, and from_email
    - Optional filters: folder, sender, date range, labels, unread status
    """
    try:
        account_id = current_user.get("account_id")
        
        # Build base query
        query = select(Message).where(Message.account_id == account_id)
        
        # Text search in subject, body, and from_email
        if search.query:
            from sqlalchemy import or_, func
            search_term = f"%{search.query.lower()}%"
            query = query.where(
                or_(
                    func.lower(Message.subject).like(search_term),
                    func.lower(Message.body_text).like(search_term),
                    func.lower(Message.from_email).like(search_term)
                )
            )
        
        # Folder filter
        if search.folder and search.folder != "all":
            folder_label = search.folder.upper()
            query = query.where(Message.labels.contains([folder_label]))
        
        # From email filter
        if search.from_email:
            query = query.where(
                func.lower(Message.from_email).like(f"%{search.from_email.lower()}%")
            )
        
        # Date range filters
        if search.date_from:
            date_from = datetime.fromisoformat(search.date_from)
            query = query.where(Message.received_date >= date_from)
        
        if search.date_to:
            date_to = datetime.fromisoformat(search.date_to)
            query = query.where(Message.received_date <= date_to)
        
        # Unread filter
        if search.is_unread is not None:
            query = query.where(Message.is_read == (not search.is_unread))
        
        # Labels filter
        if search.labels:
            for label in search.labels:
                query = query.where(Message.labels.contains([label]))
        
        # Order by date desc
        query = query.order_by(Message.received_date.desc())
        
        # Limit results
        query = query.limit(search.limit)
        
        # Execute query
        result = await db.execute(query)
        messages = result.scalars().all()
        
        # Build response with ML data
        response_messages = []
        for msg in messages:
            # Get ML data if available
            ml_result = await db.execute(
                select(MessageML).where(MessageML.message_id == msg.id)
            )
            ml_record = ml_result.scalar_one_or_none()
            
            ml_data = None
            if ml_record:
                ml_data = {
                    'summary': ml_record.summary_short,
                    'priority_score': ml_record.priority_score,
                    
                    'sentiment': ml_record.tone_label,
                    'intent': ml_record.intent_label,
                    'phishing_score': ml_record.phishing_score
                }
            
            response_messages.append(MessageResponse(
                id=str(msg.id),
                subject=msg.subject or "(No Subject)",
                from_email=msg.from_email,
                to_email=msg.to_email,
                snippet=msg.body_text[:200] if msg.body_text else "",
                body_text=msg.body_text,
                body_html=msg.body_html,
                received_date=msg.received_date.isoformat(),
                is_read=msg.is_read,
                labels=msg.labels or [],
                ml_data=ml_data
            ))
        
        return MessageList(
            messages=response_messages,
            total=len(response_messages),
            folder=search.folder or "search"
        )
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/templates")
async def get_email_templates():
    """Get predefined email templates"""
    templates = {
        "business": [
            {
                "id": "meeting_request",
                "name": "Meeting Request",
                "subject": "Meeting Request: [Topic]",
                "body": "Hi [Name],\n\nI hope this email finds you well. I would like to schedule a meeting to discuss [topic].\n\nWould you be available for a [duration] meeting on [date] at [time]?\n\nPlease let me know if this works for you or suggest an alternative time.\n\nBest regards,\n[Your Name]",
                "category": "business"
            },
            {
                "id": "follow_up",
                "name": "Follow Up",
                "subject": "Following Up: [Previous Topic]",
                "body": "Hi [Name],\n\nI wanted to follow up on my previous email regarding [topic].\n\nHave you had a chance to review it? I would appreciate any feedback or next steps.\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]",
                "category": "business"
            },
            {
                "id": "introduction",
                "name": "Business Introduction",
                "subject": "Introduction: [Your Company]",
                "body": "Dear [Name],\n\nI hope this email finds you well. My name is [Your Name] and I work at [Company].\n\nI'm reaching out because [reason for contact]. I believe we could [mutual benefit].\n\nWould you be open to a brief call to explore this further?\n\nBest regards,\n[Your Name]",
                "category": "business"
            },
            {
                "id": "proposal",
                "name": "Project Proposal",
                "subject": "Proposal: [Project Name]",
                "body": "Dear [Name],\n\nThank you for considering our proposal for [project name].\n\nAttached you will find our detailed proposal outlining:\n- Project scope\n- Timeline\n- Budget\n- Deliverables\n\nI'm available to discuss any questions you may have.\n\nBest regards,\n[Your Name]",
                "category": "business"
            }
        ],
        "personal": [
            {
                "id": "thank_you",
                "name": "Thank You Note",
                "subject": "Thank You!",
                "body": "Hi [Name],\n\nI wanted to take a moment to thank you for [reason]. Your [help/support/guidance] has been invaluable.\n\nI truly appreciate your time and effort.\n\nWarm regards,\n[Your Name]",
                "category": "personal"
            },
            {
                "id": "invitation",
                "name": "Event Invitation",
                "subject": "You're Invited: [Event Name]",
                "body": "Hi [Name],\n\nI'm excited to invite you to [event name] on [date] at [time].\n\nLocation: [venue]\n\nPlease RSVP by [date] so we can finalize arrangements.\n\nHope to see you there!\n\nBest,\n[Your Name]",
                "category": "personal"
            },
            {
                "id": "congratulations",
                "name": "Congratulations",
                "subject": "Congratulations!",
                "body": "Hi [Name],\n\nCongratulations on [achievement]! This is a wonderful accomplishment and well-deserved.\n\nWishing you continued success!\n\nWarm regards,\n[Your Name]",
                "category": "personal"
            },
            {
                "id": "apology",
                "name": "Apology",
                "subject": "My Apologies",
                "body": "Hi [Name],\n\nI want to sincerely apologize for [situation]. I understand this may have caused [impact].\n\nI take full responsibility and am committed to [resolution].\n\nThank you for your understanding.\n\nSincerely,\n[Your Name]",
                "category": "personal"
            }
        ],
        "support": [
            {
                "id": "ticket_response",
                "name": "Support Ticket Response",
                "subject": "Re: Support Ticket #[Number]",
                "body": "Hello [Name],\n\nThank you for contacting support. I've reviewed your ticket regarding [issue].\n\n[Solution or next steps]\n\nPlease let me know if this resolves your issue or if you need further assistance.\n\nBest regards,\n[Your Name]\nSupport Team",
                "category": "support"
            },
            {
                "id": "issue_resolved",
                "name": "Issue Resolved",
                "subject": "Issue Resolved: [Ticket #]",
                "body": "Hello [Name],\n\nGreat news! Your issue has been resolved.\n\nSummary of resolution:\n[Details]\n\nIf you experience any further problems, please don't hesitate to reach out.\n\nBest regards,\n[Your Name]\nSupport Team",
                "category": "support"
            },
            {
                "id": "status_update",
                "name": "Status Update",
                "subject": "Status Update: [Ticket #]",
                "body": "Hello [Name],\n\nI wanted to provide an update on your support ticket.\n\nCurrent status: [Status]\nProgress: [Progress details]\nExpected resolution: [Timeframe]\n\nThank you for your patience.\n\nBest regards,\n[Your Name]\nSupport Team",
                "category": "support"
            },
            {
                "id": "escalation",
                "name": "Issue Escalation",
                "subject": "Your Issue Has Been Escalated",
                "body": "Hello [Name],\n\nYour support ticket has been escalated to our senior team for further investigation.\n\nTicket #: [Number]\nIssue: [Description]\n\nYou can expect an update within [timeframe].\n\nThank you for your patience.\n\nBest regards,\n[Your Name]\nSupport Team",
                "category": "support"
            }
        ],
        "sales": [
            {
                "id": "cold_outreach",
                "name": "Cold Outreach",
                "subject": "Quick Question About [Company]",
                "body": "Hi [Name],\n\nI noticed [observation about their company] and thought you might be interested in [your solution].\n\nWe help companies like yours [key benefit]. Would you be open to a brief 15-minute call to explore if this could be valuable for [Company]?\n\nBest regards,\n[Your Name]",
                "category": "sales"
            },
            {
                "id": "quote",
                "name": "Price Quote",
                "subject": "Quote for [Product/Service]",
                "body": "Hi [Name],\n\nThank you for your interest in [product/service].\n\nBased on our discussion, here's a customized quote:\n\n[Quote details]\n- Item: [Description]\n- Price: [Amount]\n- Timeline: [Duration]\n\nThis quote is valid until [date].\n\nLet me know if you have any questions!\n\nBest regards,\n[Your Name]",
                "category": "sales"
            },
            {
                "id": "demo_follow_up",
                "name": "Demo Follow-Up",
                "subject": "Thanks for Joining Our Demo!",
                "body": "Hi [Name],\n\nThank you for attending our demo today! I hope you found it valuable.\n\nKey takeaways:\n- [Point 1]\n- [Point 2]\n- [Point 3]\n\nWhat are your thoughts on next steps? I'm happy to arrange a follow-up call or answer any questions.\n\nBest regards,\n[Your Name]",
                "category": "sales"
            },
            {
                "id": "closing",
                "name": "Closing Email",
                "subject": "Ready to Get Started?",
                "body": "Hi [Name],\n\nBased on our conversations, I believe [product/service] is a great fit for [Company].\n\nTo move forward, I've prepared:\n- Contract for review\n- Implementation timeline\n- Onboarding plan\n\nAre you ready to get started? I'm here to answer any final questions.\n\nBest regards,\n[Your Name]",
                "category": "sales"
            }
        ]
    }
    
    return {"templates": templates}
