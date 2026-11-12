class BusinessError(Exception):
    """A domain rule violation with the HTTP status selected by its service."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code
