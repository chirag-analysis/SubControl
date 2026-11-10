"""Application configuration loaded from environment variables."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to the backend/ directory
_backend_dir = Path(__file__).resolve().parent.parent
_env_path = _backend_dir / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_env_path),
        env_file_encoding="utf-8",
    )

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/subcontrol"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000


settings = Settings()

