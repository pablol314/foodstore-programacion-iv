from sqlmodel import Field, Relationship, SQLModel

from app.modules.categorias.models import Categoria


class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: int | None = Field(default=None, primary_key=True)
    categoria_id: int = Field(foreign_key="categorias.id", index=True)
    nombre: str = Field(min_length=2, max_length=150, index=True)
    descripcion: str | None = Field(default=None, max_length=1000)
    precio_base: float = Field(ge=0)
    imagen_url: str | None = Field(default=None, max_length=1000)
    stock: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True, index=True)
    activo: bool = Field(default=True, index=True)
    categoria: Categoria = Relationship(back_populates="productos")
    detalles: list["DetallePedido"] = Relationship(back_populates="producto")
