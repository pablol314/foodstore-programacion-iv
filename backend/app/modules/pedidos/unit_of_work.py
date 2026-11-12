from collections.abc import Callable

from sqlmodel import Session

from app.core.unit_of_work import UnitOfWork
from app.modules.pedidos.repository import DetallePedidoRepository, PedidoRepository
from app.modules.productos.repository import ProductoRepository
from app.modules.usuarios.repository import UsuarioRepository


class PedidoUnitOfWork(UnitOfWork):
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        super().__init__(session_factory)
        self.pedidos: PedidoRepository
        self.detalles: DetallePedidoRepository
        self.productos: ProductoRepository
        self.usuarios: UsuarioRepository

    def attach_repositories(self) -> None:
        self.pedidos = PedidoRepository(self.session)
        self.detalles = DetallePedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)
        self.usuarios = UsuarioRepository(self.session)
