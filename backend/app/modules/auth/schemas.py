from pydantic import EmailStr, Field, field_validator
from sqlmodel import SQLModel

from app.modules.usuarios.schemas import UserPublic


class UserCreate(SQLModel):
    username: str = Field(min_length=3, max_length=50)
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Ingresá tu nombre completo.")
        return normalized


class Message(SQLModel):
    message: str


__all__ = ["Message", "UserCreate", "UserPublic"]
