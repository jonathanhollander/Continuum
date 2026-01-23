from logging.config import fileConfig
import sys
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add the project root to the path so we can import backend modules
# When running from backend/, we need to go up one level to get to project root
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Import our configuration and models
from backend.config import settings
from backend.database import User, Estate, RefreshToken
from backend.estate_models import (
    Asset,
    FinancialAccount,
    Vendor,
    HomeAccess,
    Utility,
    Document,
    Letter,
    JournalEntry,
    Subscription,
    CalendarEvent,
    InsurancePolicy,
    MedicalProfile,
    MedicalDirective,
    Pet,
    FamilyMemory,
    VisualMemory,
    ExternalArchive,
    ContactRelationship,
    LifeEvent,
    TimeCapsuleMessage,
    FuneralData,
    AdvancedAssetData,
)
from backend.pulse_models import (
    PulseSettings,
    PulseVault,
    PulseCheckin,
    PulseEscalationLog,
    PulseEscalationTier,
    PulseContact,
    PulseSafetyTimer,
    PulseMessage,
    PulseCredential,
)
from backend.models.email_log import EmailLog
from backend.models.media import MediaFile

# Import SQLModel's metadata (all our models use SQLModel)
from sqlmodel import SQLModel

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Override the sqlalchemy.url with our DATABASE_URL from config
config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target_metadata to SQLModel's metadata (includes all our models)
target_metadata = SQLModel.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # Compare column types
        compare_server_default=True,  # Compare defaults
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Get database connection arguments (handles PostgreSQL SSL)
    connect_args = settings.get_database_connect_args()

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args=connect_args,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # Compare column types
            compare_server_default=True,  # Compare defaults
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
