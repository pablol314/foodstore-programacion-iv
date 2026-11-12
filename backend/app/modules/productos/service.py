from collections.abc import Callable

from sqlmodel import Session

from app.core.errors import BusinessError
from app.modules.categorias.schemas import CategoriaRead
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductoStockUpdate,
    ProductosPaginados,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoService:
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.session_factory = session_factory

    @staticmethod
    def _read(product: Producto, category) -> ProductoRead:
        return ProductoRead(
            id=product.id,
            categoria_id=product.categoria_id,
            nombre=product.nombre,
            descripcion=product.descripcion,
            precio_base=product.precio_base,
            imagen_url=product.imagen_url,
            stock=product.stock,
            disponible=product.disponible,
            activo=product.activo,
            categoria=CategoriaRead.model_validate(category),
        )

    def list_products(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
        include_inactive: bool = False,
    ) -> ProductosPaginados:
        with ProductoUnitOfWork(self.session_factory) as uow:
            rows, total = uow.productos.search(
                skip=skip,
                limit=limit,
                search=search,
                categoria_id=categoria_id,
                disponible=disponible,
                include_inactive=include_inactive,
            )
            return ProductosPaginados(items=[self._read(product, category) for product, category in rows], total=total)

    def get_product(self, producto_id: int, *, include_inactive: bool = False) -> ProductoRead:
        with ProductoUnitOfWork(self.session_factory) as uow:
            result = uow.productos.get_with_category(producto_id, include_inactive=include_inactive)
            if result is None:
                raise BusinessError("No se encontró el producto.", 404)
            product, category = result
            return self._read(product, category)

    def create_product(self, data: ProductoCreate) -> ProductoRead:
        with ProductoUnitOfWork(self.session_factory) as uow:
            category = uow.categorias.get_activa_by_id(data.categoria_id)
            if category is None:
                raise BusinessError("No se encontró una categoría activa con ese ID.", 404)
            product = uow.productos.add(Producto(**data.model_dump(), activo=True))
            return self._read(product, category)

    def update_product(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        with ProductoUnitOfWork(self.session_factory) as uow:
            result = uow.productos.get_with_category(producto_id)
            if result is None:
                raise BusinessError("No se encontró el producto.", 404)
            product, _ = result
            changes = data.model_dump(exclude_unset=True)
            if "categoria_id" in changes and changes["categoria_id"] is not None and changes["categoria_id"] != product.categoria_id:
                category = uow.categorias.get_activa_by_id(changes["categoria_id"])
                if category is None:
                    raise BusinessError("No se encontró una categoría activa con ese ID.", 404)
            for key, value in changes.items():
                setattr(product, key, value)
            uow.productos.save(product)
            category = uow.categorias.get_by_id(product.categoria_id)
            assert category is not None
            return self._read(product, category)

    def update_stock(self, producto_id: int, data: ProductoStockUpdate) -> ProductoRead:
        with ProductoUnitOfWork(self.session_factory) as uow:
            result = uow.productos.get_with_category(producto_id)
            if result is None:
                raise BusinessError("No se encontró el producto.", 404)
            product, category = result
            changes = data.model_dump(exclude_unset=True)
            if not changes:
                raise BusinessError("Indicá el stock o la disponibilidad que querés actualizar.", 422)
            for key, value in changes.items():
                setattr(product, key, value)
            uow.productos.save(product)
            return self._read(product, category)

    def deactivate_product(self, producto_id: int) -> None:
        with ProductoUnitOfWork(self.session_factory) as uow:
            result = uow.productos.get_with_category(producto_id)
            if result is None:
                raise BusinessError("No se encontró el producto.", 404)
            product, _ = result
            product.activo = False
            uow.productos.save(product)
