from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.database import get_session_factory
from app.core.deps import optional_current_user, require_role
from app.core.errors import BusinessError
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaService
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def get_categoria_service(session_factory=Depends(get_session_factory)) -> CategoriaService:
    return CategoriaService(session_factory)


def _raise_http_error(error: BusinessError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.get("", response_model=list[CategoriaRead])
def list_categories(
    user: Usuario | None = Depends(optional_current_user),
    service: CategoriaService = Depends(get_categoria_service),
) -> list[CategoriaRead]:
    return service.list_categories(include_inactive=user is not None and user.role == "admin")


@router.get("/{categoria_id}", response_model=CategoriaRead)
def get_category(categoria_id: int, service: CategoriaService = Depends(get_categoria_service)) -> CategoriaRead:
    try:
        return service.get_category(categoria_id)
    except BusinessError as error:
        _raise_http_error(error)


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoriaCreate,
    _: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.create_category(data)
    except BusinessError as error:
        _raise_http_error(error)


@router.put("/{categoria_id}", response_model=CategoriaRead)
def update_category(
    categoria_id: int,
    data: CategoriaUpdate,
    _: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
) -> CategoriaRead:
    try:
        return service.update_category(categoria_id, data)
    except BusinessError as error:
        _raise_http_error(error)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_category(
    categoria_id: int,
    _: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
) -> Response:
    try:
        service.deactivate_category(categoria_id)
    except BusinessError as error:
        _raise_http_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
