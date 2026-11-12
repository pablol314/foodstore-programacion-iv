from pydantic import ConfigDict, Field, field_validator, model_validator
from sqlmodel import SQLModel


class CategoriaCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)

    @field_validator("nombre")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("El nombre de la categoría debe tener al menos dos caracteres.")
        return normalized


class CategoriaUpdate(SQLModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)

    @field_validator("nombre")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("El nombre de la categoría debe tener al menos dos caracteres.")
        return normalized

    @model_validator(mode="after")
    def reject_null_name(self) -> "CategoriaUpdate":
        if "nombre" in self.model_fields_set and self.nombre is None:
            raise ValueError("El nombre de la categoría no puede ser nulo.")
        return self


class CategoriaRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    activo: bool
