from collections.abc import Callable

from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository


class CategoriaUnitOfWork(UnitOfWork):
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        super().__init__(session_factory)
        self.categorias: CategoriaRepository

    def attach_repositories(self) -> None:
        self.categorias = CategoriaRepository(self.session)
