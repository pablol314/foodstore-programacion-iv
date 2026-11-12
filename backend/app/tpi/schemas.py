from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import ConfigDict, EmailStr, Field, field_validator
from sqlmodel import SQLModel


class UserCreate(SQLModel):
    username: str = Field(min_length=3, max_length=50)
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator('username')
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator('full_name')
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError('Ingresá tu nombre completo.')
        return normalized


class UserRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    email: EmailStr
    role: str
    disabled: bool
    created_at: datetime


class CategoryCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)

    @field_validator('nombre')
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError('El nombre de la categoría debe tener al menos dos caracteres.')
        return normalized


class CategoryUpdate(SQLModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)
    activo: bool | None = None

    @field_validator('nombre')
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError('El nombre de la categoría debe tener al menos dos caracteres.')
        return normalized


class CategoryRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    activo: bool


class ProductCreate(SQLModel):
    categoria_id: int
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: str | None = Field(default=None, max_length=1000)
    precio: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    imagen_url: str | None = Field(default=None, max_length=1000)
    stock: int = Field(default=0, ge=0)
    disponible: bool = True

    @field_validator('nombre')
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError('El nombre del producto debe tener al menos dos caracteres.')
        return normalized


class ProductUpdate(SQLModel):
    categoria_id: int | None = None
    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    descripcion: str | None = Field(default=None, max_length=1000)
    precio: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    imagen_url: str | None = Field(default=None, max_length=1000)
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None

    @field_validator('nombre')
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError('El nombre del producto debe tener al menos dos caracteres.')
        return normalized


class ProductRead(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    categoria_id: int
    categoria_nombre: str
    nombre: str
    descripcion: str | None
    precio: Decimal
    imagen_url: str | None
    stock: int
    disponible: bool
    activo: bool


class ProductPage(SQLModel):
    items: list[ProductRead]
    total: int
    page: int
    page_size: int


class StockUpdate(SQLModel):
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None


class OrderItemCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1, le=100)


class OrderCreate(SQLModel):
    items: list[OrderItemCreate] = Field(min_length=1)
    forma_pago: Literal['EFECTIVO', 'TRANSFERENCIA']
    direccion_entrega: str = Field(min_length=5, max_length=200)
    notas: str | None = Field(default=None, max_length=1000)

    @field_validator('direccion_entrega')
    @classmethod
    def normalize_address(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 5:
            raise ValueError('La dirección debe tener al menos cinco caracteres.')
        return normalized


class OrderItemRead(SQLModel):
    id: int
    producto_id: int
    cantidad: int
    nombre_producto: str
    precio_unitario: Decimal
    subtotal: Decimal


class OrderRead(SQLModel):
    id: int
    usuario_id: int
    usuario_nombre: str
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: str | None
    total: Decimal
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]


class OrderStateUpdate(SQLModel):
    estado: Literal['PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO']


class AdminSummary(SQLModel):
    pedidos_hoy: int
    ventas_entregadas_hoy: Decimal
    pedidos_pendientes: int
    pedidos_en_preparacion: int
    pedidos_entregados: int
    productos_activos: int
    usuarios_activos: int


class Message(SQLModel):
    message: str
