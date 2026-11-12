from collections.abc import Callable

from sqlmodel import Session

from app.core.errors import BusinessError
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.session_factory = session_factory

    def list_users(self) -> list[UserPublic]:
        with UsuarioUnitOfWork(self.session_factory) as uow:
            return [UserPublic.model_validate(user) for user in uow.usuarios.list_newest_first()]

    def set_disabled(self, user_id: int, disabled: bool, acting_user: Usuario) -> UserPublic:
        with UsuarioUnitOfWork(self.session_factory) as uow:
            user = uow.usuarios.get_by_id(user_id)
            if user is None:
                raise BusinessError("No se encontró el usuario.", 404)
            if user.id == acting_user.id and disabled:
                raise BusinessError("No podés desactivar tu propia cuenta.", 400)
            user.disabled = disabled
            uow.usuarios.save(user)
            return UserPublic.model_validate(user)
