from collections.abc import Callable
from types import TracebackType

from sqlmodel import Session


class UnitOfWork:
    """Una sesión y una transacción para completar cada operación de negocio."""

    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.session_factory = session_factory
        self.session: Session | None = None

    def __enter__(self) -> 'UnitOfWork':
        from app.tpi.models import Categoria, DetallePedido, Pedido, Producto, Usuario
        from app.core.base_repository import BaseRepository

        self.session = self.session_factory()
        self.usuarios = BaseRepository(self.session, Usuario)
        self.categorias = BaseRepository(self.session, Categoria)
        self.productos = BaseRepository(self.session, Producto)
        self.pedidos = BaseRepository(self.session, Pedido)
        self.detalles = BaseRepository(self.session, DetallePedido)
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: TracebackType | None,
    ) -> bool:
        _ = (exc_value, traceback)
        assert self.session is not None
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        except Exception:
            self.session.rollback()
            raise
        finally:
            self.session.close()
        return False
