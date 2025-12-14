#!/usr/bin/env python3
"""
Initialize vector embeddings for existing emails.
Run this after setting up Qdrant to index your email database.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.models import Message
from app.services.ai.vector_store import vector_store
from datetime import datetime


async def initialize_embeddings(batch_size: int = 50, account_id: int = None):
    """
    Index all emails from database into vector store.
    
    Args:
        batch_size: Number of emails to process at once
        account_id: Optional account filter
    """
    print("🚀 Starting vector embedding initialization...")
    
    # Initialize collection
    print("📦 Creating Qdrant collection...")
    success = await vector_store.initialize_collection()
    if not success:
        print("❌ Failed to initialize collection")
        return
    
    print("✅ Collection ready")
    
    # Fetch emails from database
    print("📧 Fetching emails from database...")
    async with async_session_maker() as session:
        query = select(Message)
        if account_id:
            query = query.where(Message.account_id == account_id)
        
        result = await session.execute(query)
        messages = result.scalars().all()
        
        total = len(messages)
        print(f"📊 Found {total} emails to index")
        
        if total == 0:
            print("ℹ️  No emails to index")
            return
        
        # Process in batches
        indexed = 0
        failed = 0
        
        for i in range(0, total, batch_size):
            batch = messages[i:i + batch_size]
            
            # Prepare batch data
            batch_data = []
            for msg in batch:
                batch_data.append({
                    'id': msg.id,
                    'subject': msg.subject or '',
                    'body_text': msg.body_text or '',
                    'from_email': msg.from_email or '',
                    'to_email': msg.to_email or '',
                    'labels': msg.labels or [],
                    'received_date': msg.received_date or datetime.utcnow(),
                    'account_id': msg.account_id
                })
            
            # Index batch
            print(f"⚡ Indexing batch {i // batch_size + 1}/{(total + batch_size - 1) // batch_size}...")
            results = await vector_store.batch_index_emails(batch_data)
            
            indexed += results['success']
            failed += results['failed']
            
            print(f"   ✓ Success: {results['success']}, ✗ Failed: {results['failed']}")
        
        print("\n" + "=" * 50)
        print(f"🎉 Indexing complete!")
        print(f"✅ Successfully indexed: {indexed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success rate: {indexed / total * 100:.1f}%")
        print("=" * 50)


async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Initialize vector embeddings for emails')
    parser.add_argument('--batch-size', type=int, default=50, help='Batch size for processing')
    parser.add_argument('--account-id', type=int, help='Optional: Index only specific account')
    
    args = parser.parse_args()
    
    try:
        await initialize_embeddings(
            batch_size=args.batch_size,
            account_id=args.account_id
        )
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
