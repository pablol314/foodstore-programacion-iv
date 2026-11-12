from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.usuarios.models import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Usuario)

    def get_by_username(self, username: str) -> Usuario | None:
        return self.session.exec(select(Usuario).where(Usuario.username == username)).first()

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(select(Usuario).where(Usuario.email == email)).first()

    def get_by_username_or_email(self, value: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario).where((Usuario.username == value) | (Usuario.email == value))
        ).first()

    def list_newest_first(self) -> list[Usuario]:
        return list(self.session.exec(select(Usuario).order_by(Usuario.created_at.desc())).all())

    def count_active(self) -> int:
        from sqlalchemy import func

        return int(self.session.exec(select(func.count(Usuario.id)).where(Usuario.disabled.is_(False))).one())
