from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session

from app.core.database import get_session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


def get_current_user(
    request: Request,
    session_factory: Callable[[], Session] = Depends(get_session_factory),
) -> Usuario:
    token = request.cookies.get('access_token')
    subject = decode_access_token(token) if token else None
    if subject is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Iniciá sesión para continuar.')
    with UsuarioUnitOfWork(session_factory) as uow:
        user = uow.usuarios.get_by_id(int(subject))
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='La sesión no es válida.')
        return user


def get_current_active_user(user: Usuario = Depends(get_current_user)) -> Usuario:
    if user.disabled:
        raise HTTPException(status_code=400, detail='Cuenta de usuario desactivada.')
    return user


def optional_current_user(
    request: Request,
    session_factory: Callable[[], Session] = Depends(get_session_factory),
) -> Usuario | None:
    token = request.cookies.get('access_token')
    subject = decode_access_token(token) if token else None
    if subject is None:
        return None
    with UsuarioUnitOfWork(session_factory) as uow:
        user = uow.usuarios.get_by_id(int(subject))
        return user if user is not None and not user.disabled else None


def require_role(roles: list[str]) -> Callable:
    def dependency(user: Usuario = Depends(get_current_active_user)) -> Usuario:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='El rol no está autorizado para esta acción.',
            )
        return user

    return dependency
