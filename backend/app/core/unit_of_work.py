from collections.abc import Callable
from types import TracebackType

from sqlmodel import Session


class UnitOfWork:
    """Una sesión y una transacción para completar cada operación de negocio."""

    def __init__(self, session_factory: Callable[[], Session]) -> None:
        self.session_factory = session_factory
        self.session: Session | None = None

    def __enter__(self) -> 'UnitOfWork':
        self.session = self.session_factory()
        self.attach_repositories()
        return self

    def attach_repositories(self) -> None:
        """Attach the repositories required by a domain-specific Unit of Work."""

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
