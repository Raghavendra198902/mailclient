"""Background worker for email synchronization"""

import asyncio
import logging
from datetime import datetime
from typing import Dict

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.models import Account, Message
from app.services.universal_email_service import get_email_service

logger = logging.getLogger(__name__)


class EmailSyncWorker:
    """Background worker for syncing emails"""
    
    def __init__(self, sync_interval: int = 300):
        """
        Initialize sync worker
        
        Args:
            sync_interval: Seconds between sync operations (default: 5 minutes)
        """
        self.sync_interval = sync_interval
        self.is_running = False
        self.email_service = get_email_service()
    
    async def sync_account(self, account: Account, db) -> int:
        """
        Sync messages for a single account
        
        Returns:
            Number of new messages synced
        """
        try:
            # Prepare credentials
            if account.provider in ["gmail", "outlook"]:
                credentials = {
                    "access_token": account.access_token,
                    "refresh_token": account.refresh_token
                }
            else:
                credentials = {
                    "username": account.email,
                    "password": account.imap_password,
                    "imap_server": account.imap_server
                }
            
            # Get provider and authenticate
            provider = self.email_service.get_provider(account.provider)
            await provider.authenticate(credentials)
            
            # Fetch messages - FULL SYNC with 500 messages per label
            messages = await provider.list_messages(max_results=500)
            
            # Store new messages
            synced_count = 0
            for msg_data in messages:
                # Check if exists
                existing = await db.execute(
                    select(Message).where(
                        Message.account_id == account.id,
                        Message.provider_message_id == msg_data.get("id")
                    )
                )
                if existing.scalar_one_or_none():
                    continue
                
                # Create message
                message = Message(
                    account_id=account.id,
                    provider_message_id=msg_data.get("id"),
                    subject=msg_data.get("subject", ""),
                    from_email=msg_data.get("from", ""),
                    to_email=msg_data.get("to", ""),
                    body_text=msg_data.get("body_text", ""),
                    body_html=msg_data.get("body_html", ""),
                    received_date=datetime.fromisoformat(
                        msg_data.get("date", datetime.now().isoformat())
                    ),
                    is_read=msg_data.get("is_read", False),
                    labels=msg_data.get("labels", ["INBOX"])
                )
                db.add(message)
                synced_count += 1
            
            await db.commit()
            
            logger.info(f"Synced {synced_count} new messages for account {account.email}")
            return synced_count
            
        except Exception as e:
            logger.error(f"Failed to sync account {account.email}: {str(e)}")
            return 0
    
    async def sync_all_accounts(self):
        """Sync all active email accounts"""
        async with AsyncSessionLocal() as db:
            try:
                # Get all active accounts
                result = await db.execute(
                    select(Account).where(Account.is_active == True)
                )
                accounts = result.scalars().all()
                
                logger.info(f"Starting sync for {len(accounts)} accounts")
                
                total_synced = 0
                for account in accounts:
                    synced = await self.sync_account(account, db)
                    total_synced += synced
                
                logger.info(f"Sync complete: {total_synced} new messages across all accounts")
                
            except Exception as e:
                logger.error(f"Sync worker error: {str(e)}")
    
    async def run(self):
        """Main worker loop"""
        self.is_running = True
        logger.info(f"Email sync worker started (interval: {self.sync_interval}s)")
        
        while self.is_running:
            try:
                await self.sync_all_accounts()
                await asyncio.sleep(self.sync_interval)
            except Exception as e:
                logger.error(f"Worker error: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    def stop(self):
        """Stop the worker"""
        self.is_running = False
        logger.info("Email sync worker stopped")


# Global worker instance
_worker: EmailSyncWorker = None


def get_sync_worker(sync_interval: int = 300) -> EmailSyncWorker:
    """Get or create sync worker singleton"""
    global _worker
    if _worker is None:
        _worker = EmailSyncWorker(sync_interval)
    return _worker


async def start_sync_worker(sync_interval: int = 300):
    """Start the sync worker"""
    worker = get_sync_worker(sync_interval)
    await worker.run()


def stop_sync_worker():
    """Stop the sync worker"""
    global _worker
    if _worker:
        _worker.stop()
