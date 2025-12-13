"""Database models"""

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Account(Base):
    """User account model"""
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False, index=True)
    provider = Column(String, nullable=False)  # gmail, outlook, yahoo, imap
    is_active = Column(Boolean, default=True)
    
    # OAuth tokens (for Gmail, Outlook)
    access_token = Column(Text)
    refresh_token = Column(Text)
    token_expires_at = Column(DateTime(timezone=True))
    
    # IMAP/SMTP credentials (encrypted)
    imap_username = Column(String)
    imap_password = Column(Text)  # Should be encrypted
    imap_server = Column(String)
    smtp_server = Column(String)
    smtp_password = Column(Text)  # Separate SMTP password if needed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    messages = relationship("Message", back_populates="account", cascade="all, delete-orphan")
    inbox_health = relationship("InboxHealth", back_populates="account", cascade="all, delete-orphan")
    contacts = relationship("ContactIntelligence", back_populates="account", cascade="all, delete-orphan")


class Message(Base):
    """Email message model"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    provider_message_id = Column(String, index=True)  # ID from provider (Gmail, Outlook, etc.)
    thread_id = Column(String, index=True)
    subject = Column(Text)
    from_email = Column(String)  # Changed from sender
    to_email = Column(String)  # Changed from recipient
    body_text = Column(Text)
    body_html = Column(Text)
    received_date = Column(DateTime(timezone=True))  # Changed from received_at
    is_read = Column(Boolean, default=False)
    labels = Column(ARRAY(String))  # PostgreSQL text[] type
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="messages")
    ml_data = relationship("MessageML", back_populates="message", uselist=False, cascade="all, delete-orphan")


class MessageML(Base):
    """ML processed data for messages"""
    __tablename__ = "message_ml_v2"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False, unique=True)
    
    # Summaries
    summary_short = Column(Text)
    summary_long = Column(Text)
    summary_actionable = Column(Text)
    suggested_reply = Column(Text)
    
    # Scores and classifications
    priority_score = Column(Float)
    phishing_score = Column(Float)
    anomaly_score = Column(Float)
    
    # Tone and intent
    tone_label = Column(String)
    intent_label = Column(String)
    
    # Clustering
    topic_cluster_id = Column(Integer)
    
    # Entities
    pii_entities = Column(JSONB)
    
    # Embeddings
    embedding_id = Column(String)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    message = relationship("Message", back_populates="ml_data")


class ContactIntelligence(Base):
    """Contact intelligence and ranking"""
    __tablename__ = "contact_intelligence"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    email = Column(String, nullable=False)
    rank_score = Column(Float)
    interaction_count = Column(Integer, default=0)
    last_interaction = Column(DateTime(timezone=True))
    graph_node_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="contacts")


class InboxHealth(Base):
    """Inbox health metrics"""
    __tablename__ = "inbox_health"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    score = Column(Float)
    breakdown = Column(JSONB)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="inbox_health")
