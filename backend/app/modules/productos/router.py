from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.database import get_session_factory
from app.core.deps import optional_current_user, require_role
from app.core.errors import BusinessError
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoStockUpdate,
    ProductosPaginados,
    ProductoUpdate,
)
from app.modules.productos.service import ProductoService
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/productos", tags=["Productos"])


def get_producto_service(session_factory=Depends(get_session_factory)) -> ProductoService:
    return ProductoService(session_factory)


def _raise_http_error(error: BusinessError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("", response_model=ProductosPaginados)
def list_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    categoria_id: int | None = Query(default=None, ge=1),
    disponible: bool | None = None,
    user: Usuario | None = Depends(optional_current_user),
    service: ProductoService = Depends(get_producto_service),
) -> ProductosPaginados:
    return service.list_products(
        skip=skip,
        limit=limit,
        search=search,
        categoria_id=categoria_id,
        disponible=disponible,
        include_inactive=user is not None and user.role == "admin",
    )


@router.get("/{producto_id}", response_model=ProductoRead)
def get_product(producto_id: int, service: ProductoService = Depends(get_producto_service)) -> ProductoRead:
    try:
        return service.get_product(producto_id)
    except BusinessError as error:
        _raise_http_error(error)


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductoCreate,
    _: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.create_product(data)
    except BusinessError as error:
        _raise_http_error(error)


@router.put("/{producto_id}", response_model=ProductoRead)
def update_product(
    producto_id: int,
    data: ProductoUpdate,
    _: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.update_product(producto_id, data)
    except BusinessError as error:
        _raise_http_error(error)


@router.patch("/{producto_id}/stock", response_model=ProductoRead)
def update_stock(
    producto_id: int,
    data: ProductoStockUpdate,
    _: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> ProductoRead:
    try:
        return service.update_stock(producto_id, data)
    except BusinessError as error:
        _raise_http_error(error)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_product(
    producto_id: int,
    _: Usuario = Depends(require_role(["admin"])),
    service: ProductoService = Depends(get_producto_service),
) -> Response:
    try:
        service.deactivate_product(producto_id)
    except BusinessError as error:
        _raise_http_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
