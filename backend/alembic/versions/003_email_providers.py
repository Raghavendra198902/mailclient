"""Add email_providers table

Revision ID: 003_email_providers
Revises: 002_add_users
Create Date: 2025-12-14 06:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_email_providers'
down_revision: Union[str, None] = '002_add_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create email_providers table
    op.create_table(
        'email_providers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password', sa.Text(), nullable=False),
        sa.Column('app_password', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), server_default='inactive', nullable=True),
        sa.Column('last_sync', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    
    # Create index on email
    op.create_index('ix_email_providers_email', 'email_providers', ['email'])


def downgrade() -> None:
    op.drop_index('ix_email_providers_email', table_name='email_providers')
    op.drop_table('email_providers')
