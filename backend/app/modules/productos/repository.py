from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def get_with_category(self, producto_id: int, *, include_inactive: bool = False) -> tuple[Producto, Categoria] | None:
        statement = select(Producto, Categoria).join(Categoria).where(Producto.id == producto_id)
        if not include_inactive:
            statement = statement.where(Producto.activo.is_(True))
        return self.session.exec(statement).first()

    def get_for_update(self, producto_id: int) -> Producto | None:
        return self.session.exec(
            select(Producto).where(Producto.id == producto_id).with_for_update()
        ).first()

    def search(
        self,
        *,
        skip: int,
        limit: int,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
        include_inactive: bool = False,
    ) -> tuple[list[tuple[Producto, Categoria]], int]:
        statement = select(Producto, Categoria).join(Categoria)
        count_statement = select(func.count(Producto.id)).join(Categoria)
        filters = []
        if not include_inactive:
            filters.append(Producto.activo.is_(True))
        if search:
            filters.append(func.lower(Producto.nombre).contains(search.strip().lower()))
        if categoria_id is not None:
            filters.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            filters.append(Producto.disponible.is_(disponible))
        if filters:
            statement = statement.where(*filters)
            count_statement = count_statement.where(*filters)
        total = int(self.session.exec(count_statement).one())
        rows = self.session.exec(
            statement.order_by(Producto.nombre, Producto.id).offset(skip).limit(limit)
        ).all()
        return list(rows), total
