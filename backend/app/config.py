from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    app_name: str = "UnityCare MVP"
    environment: str = "development"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/unitycare"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    oidc_client_id: Optional[str] = None
    oidc_client_secret: Optional[str] = None

    fhir_base_url: str = "http://localhost:8000/fhir"

    cors_origins: list[str] = ["http://localhost:3000", "https://health.elmahrosa.org"]

    otel_service_name: str = "unitycare-mvp"
    otel_exporter_otlp_endpoint: Optional[str] = None

    rate_limit_per_minute: int = 60

    encryption_key: str = "change-me-in-production-32bytes!"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
