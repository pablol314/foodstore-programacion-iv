from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import Session

from app.core.database import engine
from app.core.unit_of_work import UnitOfWork
from app.tpi.models import Usuario


def get_uow_factory() -> Callable[[], UnitOfWork]:
    return lambda: UnitOfWork(lambda: Session(engine, expire_on_commit=False))


def current_user(request: Request, uow_factory: Callable[[], UnitOfWork] = Depends(get_uow_factory)) -> Usuario:
    from app.core.security import decode_access_token

    token = request.cookies.get('access_token')
    subject = decode_access_token(token) if token else None
    if subject is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Iniciá sesión para continuar.')
    with uow_factory() as uow:
        user = uow.usuarios.get(int(subject))
        if user is None or user.disabled:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='La sesión no es válida o la cuenta está desactivada.')
        return user


def optional_current_user(
    request: Request,
    uow_factory: Callable[[], UnitOfWork] = Depends(get_uow_factory),
) -> Usuario | None:
    from app.core.security import decode_access_token

    token = request.cookies.get('access_token')
    subject = decode_access_token(token) if token else None
    if subject is None:
        return None
    with uow_factory() as uow:
        user = uow.usuarios.get(int(subject))
        return user if user is not None and not user.disabled else None


def active_admin(user: Usuario = Depends(current_user)) -> Usuario:
    if user.role != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Esta acción requiere rol administrador.')
    return user
