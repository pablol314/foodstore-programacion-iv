from fastapi import APIRouter, Depends, HTTPException, status

from app.core.database import get_session_factory
from app.core.deps import require_role
from app.core.errors import BusinessError
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios"])


def get_usuario_service(session_factory=Depends(get_session_factory)) -> UsuarioService:
    return UsuarioService(session_factory)


@router.get("", response_model=list[UserPublic], dependencies=[Depends(require_role(["admin"]))])
def list_users(service: UsuarioService = Depends(get_usuario_service)) -> list[UserPublic]:
    return service.list_users()


@router.post("/{usuario_id}/activar", response_model=UserPublic)
def activate_user(
    usuario_id: int,
    _: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    try:
        return service.set_disabled(usuario_id, False, _)
    except BusinessError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.post("/{usuario_id}/desactivar", response_model=UserPublic)
def deactivate_user(
    usuario_id: int,
    admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
) -> UserPublic:
    try:
        return service.set_disabled(usuario_id, True, admin)
    except BusinessError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error
