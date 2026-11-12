from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / '.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    database_url: str = 'sqlite:///./foodstore.db'
    secret_key: str = 'replace-this-development-key-with-a-long-random-value'
    algorithm: str = 'HS256'
    access_token_expire_minutes: int = 30
    frontend_origins: str = 'http://localhost:5173'
    cookie_secure: bool = False
    admin_username: str = 'admin'
    admin_email: str = 'admin@example.com'
    admin_password: str = 'Admin1234!'

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(',') if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
