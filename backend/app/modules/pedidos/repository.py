from datetime import datetime

from sqlalchemy import func
from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def list_by_usuario(
        self,
        usuario_id: int | None,
        *,
        skip: int,
        limit: int,
        estado: str | None = None,
    ) -> tuple[list[Pedido], int]:
        statement = select(Pedido)
        count_statement = select(func.count(Pedido.id))
        filters = []
        if usuario_id is not None:
            filters.append(Pedido.usuario_id == usuario_id)
        if estado is not None:
            filters.append(Pedido.estado == estado)
        if filters:
            statement = statement.where(*filters)
            count_statement = count_statement.where(*filters)
        total = int(self.session.exec(count_statement).one())
        items = self.session.exec(
            statement.order_by(Pedido.created_at.desc(), Pedido.id.desc()).offset(skip).limit(limit)
        ).all()
        return list(items), total

    def count_by_estado(self, estado: str) -> int:
        return int(self.session.exec(
            select(func.count(Pedido.id)).where(Pedido.estado == estado)
        ).one())

    def count_created_between(self, start: datetime, end: datetime) -> int:
        return int(self.session.exec(
            select(func.count(Pedido.id)).where(Pedido.created_at >= start, Pedido.created_at < end)
        ).one())

    def sum_entregados(self) -> float:
        value = self.session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == "ENTREGADO")
        ).one()
        return float(value or 0)


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, DetallePedido)

    def list_by_pedido(self, pedido_id: int) -> list[DetallePedido]:
        return list(self.session.exec(
            select(DetallePedido).where(DetallePedido.pedido_id == pedido_id).order_by(DetallePedido.id)
        ).all())
