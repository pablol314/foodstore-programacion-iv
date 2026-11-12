from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        return self.session.exec(
            select(Categoria).where(func.lower(Categoria.nombre) == nombre.strip().lower())
        ).first()

    def get_activa_by_id(self, categoria_id: int) -> Categoria | None:
        return self.session.exec(
            select(Categoria).where(Categoria.id == categoria_id, Categoria.activo.is_(True))
        ).first()

    def list_for_catalog(self, *, include_inactive: bool = False) -> list[Categoria]:
        statement = select(Categoria).order_by(Categoria.nombre)
        if not include_inactive:
            statement = statement.where(Categoria.activo.is_(True))
        return list(self.session.exec(statement).all())
