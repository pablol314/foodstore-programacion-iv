from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

ModelT = TypeVar('ModelT', bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    """Operaciones comunes para entidades SQLModel."""

    def __init__(self, session: Session, model: type[ModelT]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, entity_id: int) -> ModelT | None:
        return self.session.get(self.model, entity_id)

    def get_all(self) -> list[ModelT]:
        return list(self.session.exec(select(self.model)).all())

    def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def save(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: ModelT) -> None:
        self.session.delete(entity)
        self.session.flush()

    # Short aliases keep repository calls readable in the domain services.
    get = get_by_id
    list = get_all
