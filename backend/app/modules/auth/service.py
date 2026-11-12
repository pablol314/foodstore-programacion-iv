from collections.abc import Callable

from sqlmodel import Session

from app.core.errors import BusinessError
from app.core.security import hash_password, verify_password
from app.modules.auth.schemas import UserCreate
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.session_factory = session_factory

    def register(self, data: UserCreate) -> UserPublic:
        with UsuarioUnitOfWork(self.session_factory) as uow:
            existing_username = uow.usuarios.get_by_username(data.username)
            existing_email = uow.usuarios.get_by_email(str(data.email).lower())
            if existing_username or existing_email:
                raise BusinessError("El nombre de usuario o el correo ya están registrados.", 409)
            user = uow.usuarios.add(Usuario(
                username=data.username,
                full_name=data.full_name,
                email=str(data.email).lower(),
                hashed_password=hash_password(data.password),
                role="user",
                disabled=False,
            ))
            return UserPublic.model_validate(user)

    def authenticate(self, username: str, password: str) -> Usuario:
        with UsuarioUnitOfWork(self.session_factory) as uow:
            user = uow.usuarios.get_by_username(username.strip().lower())
            if user is None or not verify_password(password, user.hashed_password):
                raise BusinessError("Usuario o contraseña incorrectos.", 401)
            if user.disabled:
                raise BusinessError("Cuenta de usuario desactivada.", 400)
            return user
