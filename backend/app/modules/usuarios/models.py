from datetime import UTC, datetime

from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(min_length=3, max_length=50, unique=True, index=True)
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(max_length=254, unique=True, index=True)
    hashed_password: str = Field(max_length=255)
    role: str = Field(default="user", max_length=10, index=True)
    disabled: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    pedidos: list["Pedido"] = Relationship(back_populates="usuario")
