from collections.abc import Callable

from sqlmodel import Session

from app.core.errors import BusinessError
from app.modules.categorias.models import Categoria
from app.modules.categorias.repository import CategoriaRepository
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaService:
    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.session_factory = session_factory

    def list_categories(self, *, include_inactive: bool = False) -> list[CategoriaRead]:
        with CategoriaUnitOfWork(self.session_factory) as uow:
            return [CategoriaRead.model_validate(category) for category in uow.categorias.list_for_catalog(
                include_inactive=include_inactive
            )]

    def get_category(self, categoria_id: int) -> CategoriaRead:
        with CategoriaUnitOfWork(self.session_factory) as uow:
            category = uow.categorias.get_activa_by_id(categoria_id)
            if category is None:
                raise BusinessError("No se encontró la categoría.", 404)
            return CategoriaRead.model_validate(category)

    def create_category(self, data: CategoriaCreate) -> CategoriaRead:
        with CategoriaUnitOfWork(self.session_factory) as uow:
            if uow.categorias.get_by_nombre(data.nombre):
                raise BusinessError("Ya existe una categoría con ese nombre.", 409)
            category = uow.categorias.add(Categoria(nombre=data.nombre, descripcion=data.descripcion))
            return CategoriaRead.model_validate(category)

    def update_category(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        with CategoriaUnitOfWork(self.session_factory) as uow:
            category = uow.categorias.get_activa_by_id(categoria_id)
            if category is None:
                raise BusinessError("No se encontró la categoría.", 404)
            changes = data.model_dump(exclude_unset=True)
            if "nombre" in changes and changes["nombre"] is not None:
                duplicate = uow.categorias.get_by_nombre(changes["nombre"])
                if duplicate is not None and duplicate.id != category.id:
                    raise BusinessError("Ya existe una categoría con ese nombre.", 409)
            for key, value in changes.items():
                setattr(category, key, value)
            uow.categorias.save(category)
            return CategoriaRead.model_validate(category)

    def deactivate_category(self, categoria_id: int) -> None:
        with CategoriaUnitOfWork(self.session_factory) as uow:
            category = uow.categorias.get_activa_by_id(categoria_id)
            if category is None:
                raise BusinessError("No se encontró la categoría.", 404)
            category.activo = False
            uow.categorias.save(category)
