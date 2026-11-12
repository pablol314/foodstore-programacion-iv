from pydantic import ConfigDict, Field, field_validator, model_validator
from sqlmodel import SQLModel

from app.modules.categorias.schemas import CategoriaRead


class ProductoCreate(SQLModel):
    categoria_id: int
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: str | None = Field(default=None, max_length=1000)
    precio_base: float = Field(ge=0)
    imagen_url: str | None = Field(default=None, max_length=1000)
    stock: int = Field(default=0, ge=0)
    disponible: bool = True

    @field_validator("nombre")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("El nombre del producto debe tener al menos dos caracteres.")
        return normalized


class ProductoUpdate(SQLModel):
    categoria_id: int | None = None
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    descripcion: str | None = Field(default=None, max_length=1000)
    precio_base: float | None = Field(default=None, ge=0)
    imagen_url: str | None = Field(default=None, max_length=1000)
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None

    @field_validator("nombre")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("El nombre del producto debe tener al menos dos caracteres.")
        return normalized

    @model_validator(mode="after")
    def reject_null_required_fields(self) -> "ProductoUpdate":
        for name in ("categoria_id", "nombre", "precio_base", "stock", "disponible"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name} no puede ser nulo.")
        return self


class ProductoRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    categoria_id: int
    nombre: str
    descripcion: str | None
    precio_base: float
    imagen_url: str | None
    stock: int
    disponible: bool
    activo: bool
    categoria: CategoriaRead


class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]


class ProductoStockUpdate(SQLModel):
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None

    @model_validator(mode="after")
    def reject_null_values(self) -> "ProductoStockUpdate":
        if "stock" in self.model_fields_set and self.stock is None:
            raise ValueError("stock no puede ser nulo.")
        if "disponible" in self.model_fields_set and self.disponible is None:
            raise ValueError("disponible no puede ser nulo.")
        return self
