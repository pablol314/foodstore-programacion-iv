from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.database import get_session_factory
from app.core.deps import get_current_active_user, require_role
from app.core.errors import BusinessError
from app.modules.pedidos.schemas import (
    CambioEstado,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import PedidoService
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])
OrderState = Literal["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"]


def get_pedido_service(session_factory=Depends(get_session_factory)) -> PedidoService:
    return PedidoService(session_factory)


def _raise_http_error(error: BusinessError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("/resumen", response_model=ResumenPedidos)
def order_summary(
    _: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service),
) -> ResumenPedidos:
    return service.summary()


@router.get("", response_model=PedidosPaginados)
def list_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    estado: OrderState | None = None,
    user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidosPaginados:
    return service.list_orders(user, admin=user.role == "admin", skip=skip, limit=limit, estado=estado)


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED)
def create_order(
    data: PedidoCreate,
    user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.create_order(data, user)
    except BusinessError as error:
        _raise_http_error(error)


@router.get("/{pedido_id}", response_model=PedidoRead)
def get_order(
    pedido_id: int,
    user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.get_order(pedido_id, user, admin=user.role == "admin")
    except BusinessError as error:
        _raise_http_error(error)


@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
def change_order_state(
    pedido_id: int,
    data: CambioEstado,
    _: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.change_state(pedido_id, data)
    except BusinessError as error:
        _raise_http_error(error)


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead)
def cancel_order(
    pedido_id: int,
    user: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
) -> PedidoRead:
    try:
        return service.cancel_order(pedido_id, user)
    except BusinessError as error:
        _raise_http_error(error)
