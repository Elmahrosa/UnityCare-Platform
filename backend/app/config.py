import sys
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "UnityCare MVP"
    environment: str = "development"
    debug: bool = False

    database_url: str = ""
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    oidc_client_id: Optional[str] = None
    oidc_client_secret: Optional[str] = None

    fhir_base_url: str = "http://localhost:8000/fhir"

    cors_origins: list[str] = ["http://localhost:3000"]

    otel_service_name: str = "unitycare-mvp"
    otel_exporter_otlp_endpoint: Optional[str] = None

    rate_limit_per_minute: int = 60

    encryption_key: str = ""

    db_pool_size: int = 20
    db_max_overflow: int = 10

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        errors = []
        if not self.database_url:
            errors.append("DATABASE_URL must be set")
        if not self.jwt_secret or self.jwt_secret == "change-me-in-production":
            errors.append("JWT_SECRET must be set to a secure random value")
        if not self.encryption_key or self.encryption_key == "change-me-in-production-32bytes!":
            errors.append("ENCRYPTION_KEY must be set to a secure random value")
        if self.environment == "production" and len(self.jwt_secret) < 32:
            errors.append("JWT_SECRET must be at least 32 characters in production")
        if errors:
            print("CRITICAL: Missing required config:", "; ".join(errors), file=sys.stderr)
            sys.exit(1)


settings = Settings()
