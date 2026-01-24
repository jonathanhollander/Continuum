"""add_global_custom_fields_support

Revision ID: 2d53606557e8
Revises: 57c5130143b3
Create Date: 2026-01-24 03:47:56.782613

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '2d53606557e8'
down_revision: Union[str, Sequence[str], None] = '57c5130143b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - add custom_attributes to tables that need it."""
    # SQLite doesn't support ALTER COLUMN, so we only add new columns
    # and create new indexes. Existing columns with custom_attributes
    # already work fine.

    # Add custom_attributes column to tables that don't have it
    op.add_column('funeraldata', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))
    op.add_column('heirlooms', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))
    op.add_column('letters', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))
    op.add_column('lifeevent', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))
    op.add_column('pulse_contacts', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))
    op.add_column('subscriptions', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))
    op.add_column('timecapsulemessage', sa.Column('custom_attributes', sa.String(), nullable=True, server_default='{}'))

    # Create indexes for user_custom_field_definitions (if table exists)
    # Using batch mode to handle SQLite limitations
    try:
        op.create_index(op.f('ix_user_custom_field_definitions_entity_type'), 'user_custom_field_definitions', ['entity_type'], unique=False)
        op.create_index(op.f('ix_user_custom_field_definitions_user_id'), 'user_custom_field_definitions', ['user_id'], unique=False)
    except Exception:
        # Indexes may already exist
        pass


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    try:
        op.drop_index(op.f('ix_user_custom_field_definitions_user_id'), table_name='user_custom_field_definitions')
        op.drop_index(op.f('ix_user_custom_field_definitions_entity_type'), table_name='user_custom_field_definitions')
    except Exception:
        pass

    # Drop custom_attributes columns from tables we added them to
    op.drop_column('timecapsulemessage', 'custom_attributes')
    op.drop_column('subscriptions', 'custom_attributes')
    op.drop_column('pulse_contacts', 'custom_attributes')
    op.drop_column('lifeevent', 'custom_attributes')
    op.drop_column('letters', 'custom_attributes')
    op.drop_column('heirlooms', 'custom_attributes')
    op.drop_column('funeraldata', 'custom_attributes')
