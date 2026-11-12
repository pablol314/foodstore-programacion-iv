from datetime import UTC, datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class Usuario(SQLModel, table=True):
    __tablename__ = 'usuarios'

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(min_length=3, max_length=50, unique=True, index=True)
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(max_length=254, unique=True, index=True)
    hashed_password: str = Field(max_length=255)
    role: str = Field(default='user', max_length=10, index=True)
    disabled: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=utcnow)
    pedidos: list['Pedido'] = Relationship(back_populates='usuario')


class Categoria(SQLModel, table=True):
    __tablename__ = 'categorias'

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(min_length=2, max_length=100, unique=True, index=True)
    descripcion: str | None = Field(default=None, max_length=500)
    activo: bool = Field(default=True, index=True)
    productos: list['Producto'] = Relationship(back_populates='categoria')


class Producto(SQLModel, table=True):
    __tablename__ = 'productos'

    id: int | None = Field(default=None, primary_key=True)
    categoria_id: int = Field(foreign_key='categorias.id', index=True)
    nombre: str = Field(min_length=2, max_length=150, index=True)
    descripcion: str | None = Field(default=None, max_length=1000)
    precio: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    imagen_url: str | None = Field(default=None, max_length=1000)
    stock: int = Field(default=0, ge=0)
    disponible: bool = Field(default=True, index=True)
    activo: bool = Field(default=True, index=True)
    categoria: Categoria = Relationship(back_populates='productos')
    detalles: list['DetallePedido'] = Relationship(back_populates='producto')


class Pedido(SQLModel, table=True):
    __tablename__ = 'pedidos'

    id: int | None = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key='usuarios.id', index=True)
    estado: str = Field(default='PENDIENTE', max_length=24, index=True)
    forma_pago: str = Field(max_length=20)
    direccion_entrega: str = Field(min_length=5, max_length=200)
    notas: str | None = Field(default=None, max_length=1000)
    total: Decimal = Field(default=Decimal('0.00'), ge=0, max_digits=12, decimal_places=2)
    created_at: datetime = Field(default_factory=utcnow, index=True)
    updated_at: datetime = Field(default_factory=utcnow)
    usuario: Usuario = Relationship(back_populates='pedidos')
    items: list['DetallePedido'] = Relationship(back_populates='pedido')


class DetallePedido(SQLModel, table=True):
    __tablename__ = 'detalles_pedido'

    id: int | None = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key='pedidos.id', index=True)
    producto_id: int = Field(foreign_key='productos.id', index=True)
    cantidad: int = Field(ge=1)
    nombre_producto: str = Field(max_length=150)
    precio_unitario: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    subtotal: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    pedido: Pedido = Relationship(back_populates='items')
    producto: Producto = Relationship(back_populates='detalles')
