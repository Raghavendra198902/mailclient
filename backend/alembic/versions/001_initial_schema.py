"""Initial schema for Universal Email AI Manager

Revision ID: 001
Revises: 
Create Date: 2025-12-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create accounts table
    op.create_table(
        'accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=True),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('imap_username', sa.String(length=255), nullable=True),
        sa.Column('imap_password', sa.String(length=255), nullable=True),
        sa.Column('imap_server', sa.String(length=255), nullable=True),
        sa.Column('smtp_server', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accounts_email'), 'accounts', ['email'], unique=True)
    
    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('gmail_id', sa.String(length=255), nullable=False),
        sa.Column('thread_id', sa.String(length=255), nullable=True),
        sa.Column('subject', sa.Text(), nullable=True),
        sa.Column('sender', sa.String(length=255), nullable=True),
        sa.Column('recipient', sa.String(length=255), nullable=True),
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('received_at', sa.DateTime(), nullable=True),
        sa.Column('labels', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_messages_gmail_id'), 'messages', ['gmail_id'], unique=True)
    op.create_index(op.f('ix_messages_thread_id'), 'messages', ['thread_id'], unique=False)
    
    # Create message_ml_v2 table
    op.create_table(
        'message_ml_v2',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('summary_short', sa.Text(), nullable=True),
        sa.Column('summary_long', sa.Text(), nullable=True),
        sa.Column('summary_actionable', sa.Text(), nullable=True),
        sa.Column('suggested_reply', sa.Text(), nullable=True),
        sa.Column('priority_score', sa.Float(), nullable=True),
        sa.Column('phishing_score', sa.Float(), nullable=True),
        sa.Column('anomaly_score', sa.Float(), nullable=True),
        sa.Column('tone_label', sa.String(length=50), nullable=True),
        sa.Column('intent_label', sa.String(length=50), nullable=True),
        sa.Column('topic_cluster_id', sa.Integer(), nullable=True),
        sa.Column('pii_entities', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('embedding_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_message_ml_v2_message_id'), 'message_ml_v2', ['message_id'], unique=True)
    
    # Create contact_intelligence table
    op.create_table(
        'contact_intelligence',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('rank_score', sa.Float(), nullable=True),
        sa.Column('interaction_count', sa.Integer(), nullable=True),
        sa.Column('graph_node_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contact_intelligence_email'), 'contact_intelligence', ['email'], unique=False)
    
    # Create inbox_health table
    op.create_table(
        'inbox_health',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('inbox_health')
    op.drop_table('contact_intelligence')
    op.drop_table('message_ml_v2')
    op.drop_table('messages')
    op.drop_table('accounts')
