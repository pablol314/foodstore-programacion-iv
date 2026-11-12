from collections.abc import Callable

from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        super().__init__(session_factory)
        self.usuarios: UsuarioRepository

    def attach_repositories(self) -> None:
        self.usuarios = UsuarioRepository(self.session)
