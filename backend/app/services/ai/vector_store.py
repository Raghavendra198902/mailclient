"""
Vector Store Service using Qdrant for semantic email search.
Handles embedding generation, storage, and similarity search.
"""
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime
import asyncio

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import (
        Distance, VectorParams, PointStruct, Filter,
        FieldCondition, MatchValue, SearchRequest
    )
    QDRANT_AVAILABLE = True
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("qdrant-client not installed. Vector search features will be disabled.")
    QDRANT_AVAILABLE = False
    QdrantClient = None
    Distance = None
    VectorParams = None
    PointStruct = None
    Filter = None
    FieldCondition = None
    MatchValue = None
    SearchRequest = None

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    logger = logging.getLogger(__name__)
    logger.warning("sentence-transformers not installed. Local embeddings will be disabled.")
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None

import openai

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """
    Manages vector embeddings for semantic search across emails.
    Supports multiple embedding models and Qdrant vector database.
    """
    
    def __init__(self):
        """Initialize Qdrant client and embedding models."""
        self.enabled = QDRANT_AVAILABLE and SENTENCE_TRANSFORMERS_AVAILABLE
        
        if not self.enabled:
            logger.warning("Vector store disabled due to missing dependencies")
            self.client = None
            self.local_model = None
            self.collection_name = "email_embeddings"
            self.embedding_dimension = 384
            self.openai_enabled = False
            return
            
        self.client = QdrantClient(
            url=getattr(settings, 'QDRANT_URL', 'http://localhost:6333'),
            api_key=getattr(settings, 'QDRANT_API_KEY', None)
        )
        self.collection_name = "email_embeddings"
        self.embedding_dimension = 384  # all-MiniLM-L6-v2 dimension
        
        # Initialize local embedding model
        self.local_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # OpenAI client for advanced embeddings
        self.openai_enabled = bool(getattr(settings, 'OPENAI_API_KEY', None))
        if self.openai_enabled:
            openai.api_key = settings.OPENAI_API_KEY
    
    async def initialize_collection(self):
        """
        Create Qdrant collection if it doesn't exist.
        Schema includes email content, metadata, and timestamps.
        """
        if not self.enabled:
            logger.warning("Vector store is disabled. Skipping collection initialization.")
            return False
            
        try:
            collections = self.client.get_collections().collections
            collection_exists = any(c.name == self.collection_name for c in collections)
            
            if not collection_exists:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created collection: {self.collection_name}")
            else:
                logger.info(f"Collection already exists: {self.collection_name}")
            
            return True
        except Exception as e:
            logger.error(f"Failed to initialize collection: {e}")
            return False
    
    def _generate_embedding(self, text: str, use_openai: bool = False) -> List[float]:
        """
        Generate embedding vector for text.
        
        Args:
            text: Input text to embed
            use_openai: Use OpenAI embeddings (higher quality but paid)
        
        Returns:
            Embedding vector as list of floats
        """
        try:
            if use_openai and self.openai_enabled:
                response = openai.embeddings.create(
                    model="text-embedding-3-small",
                    input=text
                )
                return response.data[0].embedding
            else:
                # Use local Sentence Transformer model
                embedding = self.local_model.encode(text, convert_to_tensor=False)
                return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            # Fallback to local model
            if use_openai:
                embedding = self.local_model.encode(text, convert_to_tensor=False)
                return embedding.tolist()
            raise
    
    async def index_email(
        self,
        message_id: int,
        subject: str,
        body_text: str,
        from_email: str,
        to_email: str,
        labels: List[str],
        received_date: datetime,
        account_id: int
    ) -> bool:
        """
        Index an email for semantic search.
        
        Args:
            message_id: Database message ID
            subject: Email subject
            body_text: Email body content
            from_email: Sender email
            to_email: Recipient email
            labels: Gmail labels
            received_date: When email was received
            account_id: Owner account ID
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Combine subject and body for embedding
            # Prioritize subject (often contains key info)
            combined_text = f"{subject}\n\n{body_text[:2000]}"  # Limit body to 2000 chars
            
            # Generate embedding
            embedding = await asyncio.to_thread(
                self._generate_embedding,
                combined_text,
                use_openai=False
            )
            
            # Prepare metadata
            payload = {
                "message_id": message_id,
                "account_id": account_id,
                "subject": subject[:500],  # Limit for storage
                "from_email": from_email,
                "to_email": to_email,
                "labels": labels,
                "received_date": received_date.isoformat(),
                "indexed_at": datetime.utcnow().isoformat()
            }
            
            # Upsert to Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=message_id,  # Use message_id as point ID
                        vector=embedding,
                        payload=payload
                    )
                ]
            )
            
            logger.info(f"Indexed email {message_id} for account {account_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index email {message_id}: {e}")
            return False
    
    async def batch_index_emails(self, emails: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Index multiple emails in batch for efficiency.
        
        Args:
            emails: List of email dicts with required fields
        
        Returns:
            Dict with success/failure counts
        """
        if not self.enabled:
            logger.warning("Vector store is disabled. Skipping batch indexing.")
            return {"success": 0, "failed": len(emails)}
            
        results = {"success": 0, "failed": 0}
        points = []
        
        try:
            for email in emails:
                try:
                    # Extract required fields
                    message_id = email['id']
                    subject = email.get('subject', '')
                    body_text = email.get('body_text', '')
                    from_email = email.get('from_email', '')
                    to_email = email.get('to_email', '')
                    labels = email.get('labels', [])
                    received_date = email.get('received_date')
                    account_id = email.get('account_id')
                    
                    # Generate combined text
                    combined_text = f"{subject}\n\n{body_text[:2000]}"
                    
                    # Generate embedding
                    embedding = await asyncio.to_thread(
                        self._generate_embedding,
                        combined_text
                    )
                    
                    # Prepare payload
                    payload = {
                        "message_id": message_id,
                        "account_id": account_id,
                        "subject": subject[:500],
                        "from_email": from_email,
                        "to_email": to_email,
                        "labels": labels,
                        "received_date": received_date.isoformat() if received_date else None,
                        "indexed_at": datetime.utcnow().isoformat()
                    }
                    
                    points.append(
                        PointStruct(
                            id=message_id,
                            vector=embedding,
                            payload=payload
                        )
                    )
                    results["success"] += 1
                    
                except Exception as e:
                    logger.error(f"Failed to prepare email {email.get('id')}: {e}")
                    results["failed"] += 1
            
            # Batch upsert
            if points:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points
                )
                logger.info(f"Batch indexed {len(points)} emails")
        
        except Exception as e:
            logger.error(f"Batch indexing failed: {e}")
            results["failed"] = len(emails) - results["success"]
        
        return results
    
    async def semantic_search(
        self,
        query: str,
        account_id: int,
        limit: int = 10,
        labels: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search across emails.
        
        Args:
            query: Natural language search query
            account_id: Filter by account
            limit: Max number of results
            labels: Optional filter by labels
        
        Returns:
            List of matching emails with similarity scores
        """
        if not self.enabled:
            logger.warning("Vector store is disabled. Returning empty results.")
            return []
            
        try:
            # Generate query embedding
            query_embedding = await asyncio.to_thread(
                self._generate_embedding,
                query
            )
            
            # Build filter for account
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="account_id",
                        match=MatchValue(value=account_id)
                    )
                ]
            )
            
            # Add label filter if provided
            if labels:
                search_filter.must.append(
                    FieldCondition(
                        key="labels",
                        match=MatchValue(value=labels[0])  # Simplified for now
                    )
                )
            
            # Search Qdrant
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                with_payload=True
            )
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "message_id": result.payload["message_id"],
                    "subject": result.payload["subject"],
                    "from_email": result.payload["from_email"],
                    "to_email": result.payload["to_email"],
                    "labels": result.payload["labels"],
                    "received_date": result.payload["received_date"],
                    "similarity_score": result.score
                })
            
            logger.info(f"Semantic search returned {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []
    
    async def find_similar_emails(
        self,
        message_id: int,
        account_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Find emails similar to a given email.
        
        Args:
            message_id: Reference email ID
            account_id: Filter by account
            limit: Max number of results
        
        Returns:
            List of similar emails
        """
        if not self.enabled:
            logger.warning("Vector store is disabled. Returning empty results.")
            return []
            
        try:
            # Get the reference email's vector
            reference_point = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[message_id],
                with_vectors=True
            )
            
            if not reference_point:
                logger.warning(f"Email {message_id} not found in vector store")
                return []
            
            # Search using the reference vector
            search_filter = Filter(
                must=[
                    FieldCondition(
                        key="account_id",
                        match=MatchValue(value=account_id)
                    )
                ]
            )
            
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=reference_point[0].vector,
                query_filter=search_filter,
                limit=limit + 1,  # +1 because result includes the reference itself
                with_payload=True
            )
            
            # Remove the reference email from results
            filtered_results = [r for r in results if r.payload["message_id"] != message_id][:limit]
            
            # Format results
            formatted_results = []
            for result in filtered_results:
                formatted_results.append({
                    "message_id": result.payload["message_id"],
                    "subject": result.payload["subject"],
                    "from_email": result.payload["from_email"],
                    "similarity_score": result.score
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Failed to find similar emails: {e}")
            return []
    
    async def delete_email_embedding(self, message_id: int) -> bool:
        """Delete an email's embedding from the vector store."""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[message_id]
            )
            logger.info(f"Deleted embedding for email {message_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete embedding: {e}")
            return False


# Global instance
vector_store = VectorStoreService()
