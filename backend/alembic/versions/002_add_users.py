"""Add user authentication tables

Revision ID: 002_add_users
Revises: 001_initial_schema
Create Date: 2025-12-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_users'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('is_superuser', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Add user_id to accounts table
    op.add_column('accounts', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_accounts_user_id', 'accounts', 'users', ['user_id'], ['id'])
    
    # Remove unique constraint from accounts.email since users can have multiple email accounts
    op.drop_index('ix_accounts_email', table_name='accounts')
    op.create_index(op.f('ix_accounts_email'), 'accounts', ['email'], unique=False)


def downgrade() -> None:
    # Remove user_id from accounts
    op.drop_constraint('fk_accounts_user_id', 'accounts', type_='foreignkey')
    op.drop_column('accounts', 'user_id')
    
    # Restore unique index on accounts.email
    op.drop_index(op.f('ix_accounts_email'), table_name='accounts')
    op.create_index('ix_accounts_email', 'accounts', ['email'], unique=True)
    
    # Drop users table
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
