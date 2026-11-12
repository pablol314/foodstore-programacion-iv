from collections.abc import Callable, Generator

from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

connect_args = {'check_same_thread': False} if settings.database_url.startswith('sqlite') else {}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)


def create_db_and_tables() -> None:
    from app.modules.categorias.models import Categoria
    from app.modules.pedidos.models import DetallePedido, Pedido
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario

    _ = (Categoria, Producto, Usuario, Pedido, DetallePedido)
    SQLModel.metadata.create_all(engine)


def get_session_factory() -> Callable[[], Session]:
    return lambda: Session(engine, expire_on_commit=False)


def get_session() -> Generator[Session, None, None]:
    with Session(engine, expire_on_commit=False) as session:
        yield session
