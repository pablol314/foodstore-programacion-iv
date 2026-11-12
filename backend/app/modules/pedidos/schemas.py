from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator
from sqlmodel import SQLModel


class ItemPedidoCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    items: list[ItemPedidoCreate] = Field(min_length=1)
    forma_pago: Literal["EFECTIVO", "TRANSFERENCIA"]
    direccion_entrega: str = Field(min_length=5, max_length=200)
    notas: str | None = Field(default=None, max_length=1000)

    @field_validator("direccion_entrega")
    @classmethod
    def normalize_address(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 5:
            raise ValueError("La dirección debe tener entre 5 y 200 caracteres.")
        return normalized


class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: str | None
    total: float
    created_at: datetime
    updated_at: datetime
    items: list[DetallePedidoRead]


class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


class CambioEstado(SQLModel):
    estado: Literal["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"]


class ResumenPedidos(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
