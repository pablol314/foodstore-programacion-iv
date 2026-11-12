from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.core.config import settings
from app.core.database import get_session_factory
from app.core.errors import BusinessError
from app.core.security import create_access_token
from app.core.deps import get_current_active_user
from app.modules.auth.schemas import Message, UserCreate
from app.modules.auth.service import AuthService
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def get_auth_service(session_factory=Depends(get_session_factory)) -> AuthService:
    return AuthService(session_factory)


def _raise_http_error(error: BusinessError) -> None:
    raise HTTPException(status_code=error.status_code, detail=str(error)) from error


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)) -> UserPublic:
    try:
        return service.register(data)
    except BusinessError as error:
        _raise_http_error(error)


@router.post("/token", response_model=Message)
def login(
    response: Response,
    form: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service),
) -> Message:
    try:
        user = service.authenticate(form.username, form.password)
    except BusinessError as error:
        _raise_http_error(error)
    if user.id is None:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
    response.set_cookie(
        key="access_token",
        value=create_access_token(str(user.id)),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )
    return Message(message="Login exitoso")


@router.post("/logout", response_model=Message)
def logout(response: Response) -> Message:
    response.delete_cookie(
        key="access_token", httponly=True, secure=settings.cookie_secure, samesite="lax", path="/"
    )
    return Message(message="Sesión cerrada.")


@router.get("/me", response_model=UserPublic)
def me(user: Usuario = Depends(get_current_active_user)) -> UserPublic:
    return UserPublic.model_validate(user)
