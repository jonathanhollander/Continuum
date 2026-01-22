"""
Centralized Configuration Management for Continuum SaaS
Uses Pydantic Settings for type-safe environment variable handling
"""
import os
import logging
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, ValidationError, model_validator

# Use standard library logging to avoid circular imports
# (This module is imported by backend.utils.logger)
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.

    All settings have sensible defaults for local development.
    Production deployments should override these via environment variables.
    """

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Application
    APP_NAME: str = "Continuum SaaS API"
    APP_VERSION: str = "0.7.0"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Frontend URLs
    FRONTEND_URL: str = "http://localhost:5173"
    FRONTEND_URL_PRODUCTION: Optional[str] = None
    API_URL: str = "http://localhost:8000"
    API_TIMEOUT_SECONDS: int = 30

    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: str = "*"
    CORS_ALLOW_HEADERS: str = "*"

    # Database
    DATABASE_URL: str = "sqlite:///./continuum_saas.db"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # JWT Authentication
    JWT_SECRET_KEY: str = "continuum-dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # WebAuthn/Passkey Configuration
    RP_ID: str = "localhost"
    RP_NAME: str = "Continuum Estate"
    ORIGIN: str = "http://localhost:5173"

    # Email Configuration
    # Provider Selection (automatic based on available credentials):
    # 1. Postmark (recommended) - if POSTMARK_API_KEY is set
    # 2. SMTP - if SMTP_ENABLED=true and SMTP_HOST is set
    # 3. Local File Storage - fallback for development

    # Postmark (recommended for production)
    POSTMARK_API_KEY: Optional[str] = None
    POSTMARK_FROM_EMAIL: str = "noreply@continuum.im"

    # SMTP Configuration (fallback or alternative provider)
    SMTP_ENABLED: bool = False
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@continuum.im"
    SMTP_FROM_NAME: str = "Continuum Pulse"
    SMTP_USE_TLS: bool = True

    # Email Settings
    EMAIL_MAX_RETRIES: int = 3
    EMAIL_RETRY_DELAY_SECONDS: int = 60

    # File Storage
    OUTBOX_DIR: str = "backend/outbox"
    UPLOAD_DIR: str = "backend/uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB in bytes

    # Pulse Scheduler
    PULSE_SCHEDULER_ENABLED: bool = True
    PULSE_CHECK_INTERVAL_MINUTES: int = 15

    # Security
    ALLOWED_HOSTS: str = "*"
    SECRET_KEY: str = "continuum-secret-key-change-in-production"

    # Clerk (Legacy - keeping for backwards compatibility)
    CLERK_SECRET_KEY: Optional[str] = None
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Optional[str] = None

    # Rate Limiting Defaults
    DEFAULT_RATE_LIMIT_SENSITIVE: str = "5/minute"
    DEFAULT_RATE_LIMIT_STANDARD: str = "30/minute"

    # External APIs
    GITHUB_TOKEN: Optional[str] = None
    VITE_OPENROUTER_API_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None

    # Railway Specific
    RAILWAY_ENVIRONMENT: Optional[str] = None
    RAILWAY_STATIC_URL: Optional[str] = None
    RAILWAY_PUBLIC_DOMAIN: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"  # Allow extra fields for flexibility
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str) -> str:
        """Ensure CORS origins is a comma-separated string"""
        if isinstance(v, list):
            return ",".join(v)
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_database_url(cls, v: Optional[str]) -> Optional[str]:
        """
        Fix SQLAlchemy 2.0 compatibility issue:
        Replace 'postgres://' with 'postgresql://' as the former is deprecated/removed.
        Railway often provides 'postgres://'.
        """
        if v and v.startswith("postgres://"):
            # logger isn't fully configured here yet, so we use print if needed, or just rely on the fix
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
    @model_validator(mode='after')
    def configure_domain_settings(self) -> 'Settings':
        """
        Automatically configure RP_ID and ORIGIN based on Railway environment
        if not explicitly provided.
        """
        if self.RAILWAY_PUBLIC_DOMAIN:
            # If RP_ID is still default and we have a Railway domain, use it
            if self.RP_ID == "localhost":
                self.RP_ID = self.RAILWAY_PUBLIC_DOMAIN
            
            # If ORIGIN is still default and we have a Railway domain, use HTTPS
            if self.ORIGIN == "http://localhost:5173":
                self.ORIGIN = f"https://{self.RAILWAY_PUBLIC_DOMAIN}"
                
            # Also ensure Frontend URL matches
            if self.FRONTEND_URL == "http://localhost:5173" and self.ENVIRONMENT == "production":
                self.FRONTEND_URL = f"https://{self.RAILWAY_PUBLIC_DOMAIN}"
                
        return self

    def get_cors_origins_list(self) -> List[str]:
        """
        Parse and validate CORS origins.
        In production, only allow specific whitelisted domains.
        """
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

        # In production, validate and restrict to allowed domains
        if self.is_production():
            allowed_domains = [
                "continuum.im",
                "app.continuum.im",
                "continuum-saas.up.railway.app",  # Railway deployment
            ]

            # If Railway domain is set, add it to allowed list
            if self.RAILWAY_PUBLIC_DOMAIN:
                allowed_domains.append(self.RAILWAY_PUBLIC_DOMAIN)

            # Filter origins to only include allowed domains
            validated_origins = []
            for origin in origins:
                if origin == "*":
                    logger.warning("Wildcard '*' not allowed in production CORS, skipping")
                    continue

                # Check if origin contains any allowed domain
                if any(domain in origin for domain in allowed_domains):
                    validated_origins.append(origin)
                else:
                    logger.warning(f"CORS origin '{origin}' not in production whitelist, skipping")

            if not validated_origins:
                logger.warning("No valid CORS origins for production, defaulting to localhost")
                return ["http://localhost:5173"]  # Failsafe

            return validated_origins

        # Development mode - allow all specified origins
        return origins

    def get_frontend_url(self) -> str:
        """
        Get the appropriate frontend URL based on environment.
        In production, prefer RAILWAY_STATIC_URL or FRONTEND_URL_PRODUCTION.
        """
        if self.ENVIRONMENT == "production":
            if self.RAILWAY_STATIC_URL:
                return self.RAILWAY_STATIC_URL
            if self.FRONTEND_URL_PRODUCTION:
                return self.FRONTEND_URL_PRODUCTION
        return self.FRONTEND_URL

    def get_database_connect_args(self) -> dict:
        """Get database connection arguments based on database type"""
        connect_args = {}
        if "postgresql" in self.DATABASE_URL:
            # Force SSL for PostgreSQL (required by Railway)
            connect_args["sslmode"] = "require"
        return connect_args

    def validate_production_config(self) -> List[str]:
        """
        Validate configuration for production deployment.
        Returns list of validation errors.
        """
        errors = []

        if self.ENVIRONMENT == "production":
            # Check critical secrets are not defaults
            if self.JWT_SECRET_KEY == "continuum-dev-secret-key-change-in-production":
                errors.append("JWT_SECRET_KEY must be changed in production")

            if self.SECRET_KEY == "continuum-secret-key-change-in-production":
                errors.append("SECRET_KEY must be changed in production")

            # Check URLs don't contain localhost
            if "localhost" in self.FRONTEND_URL.lower():
                errors.append("FRONTEND_URL should not contain 'localhost' in production")

            if "localhost" in self.ORIGIN.lower():
                errors.append("ORIGIN should not contain 'localhost' in production")

            if "localhost" in self.RP_ID.lower():
                errors.append("RP_ID should not be 'localhost' in production")

            # Check database is not SQLite in production
            if "sqlite" in self.DATABASE_URL.lower():
                errors.append("DATABASE_URL should use PostgreSQL in production, not SQLite")

            # Warn about CORS wildcards
            if "*" in self.get_cors_origins_list():
                errors.append("CORS_ORIGINS should not use wildcard '*' in production")

        return errors

    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.ENVIRONMENT.lower() in ["production", "prod"]

    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.ENVIRONMENT.lower() in ["development", "dev", "local"]


# Global settings instance
# This will be imported throughout the application
try:
    settings = Settings()

    # Validate production configuration on startup
    if settings.is_production():
        validation_errors = settings.validate_production_config()
        if validation_errors:
            logger.warning("Production configuration warnings detected:")
            for error in validation_errors:
                logger.warning(f"  - {error}")
        else:
            logger.info("Production configuration validated successfully")
    else:
        logger.info(f"Running in {settings.ENVIRONMENT} mode")

except ValidationError as e:
    logger.error(f"Configuration validation error: {e}", exc_info=True)
    raise


# Helper function to get settings (useful for dependency injection)
def get_settings() -> Settings:
    """Get the global settings instance"""
    return settings
