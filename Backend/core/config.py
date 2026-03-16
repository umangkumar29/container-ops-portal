from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env."""

    project_name: str = Field(
        "Azure Container Apps Manager",
        description="Human readable name that appears in the OpenAPI docs.",
    )
    database_url: str = Field(
        "postgresql://postgres:postgres@localhost:5432/container_manager",
        alias="DATABASE_URL",
    )

    azure_tenant_id: Optional[str] = Field(default=None, alias="AZURE_TENANT_ID")
    azure_client_id: Optional[str] = Field(default=None, alias="AZURE_CLIENT_ID")
    azure_client_secret: Optional[str] = Field(default=None, alias="AZURE_CLIENT_SECRET")
    azure_subscription_id: Optional[str] = Field(default=None, alias="AZURE_SUBSCRIPTION_ID")
    cost_cache_ttl_seconds: int = Field(
        default=300,
        alias="COST_CACHE_TTL_SECONDS",
        ge=0,
        description="Seconds to keep Azure cost responses cached. Set to 0 to disable caching.",
    )

    # Restrict to specific origins — never use "*" in production.
    # In production set CORS_ALLOW_ORIGINS to your frontend URL, e.g.:
    #   CORS_ALLOW_ORIGINS='["https://devops-portal.yourcompany.com"]'
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"]
    )
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = Field(default_factory=lambda: ["GET", "POST", "OPTIONS"])
    cors_allow_headers: list[str] = Field(default_factory=lambda: ["Authorization", "Content-Type"])
    docs_url: str | None = Field("/api/docs", alias="DOCS_URL")
    openapi_url: str = Field("/api/openapi.json", alias="OPENAPI_URL")
    redoc_url: str | None = Field("/api/redoc", alias="REDOC_URL")

    class Config:
        env_file = ".env"
        case_sensitive = False
        populate_by_name = True


@lru_cache
def get_settings() -> Settings:
    """Return a cached instance of application settings."""
    return Settings()
 