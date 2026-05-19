from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True)
class ValidationFieldError:
    message: str
    path: str


class ConjoinError(Exception):
    status_code: int
    code: str
    request_id: str | None

    def __init__(
        self,
        message: str,
        *,
        status_code: int = 0,
        code: str = "conjoin_error",
        request_id: str | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.request_id = request_id


class ConjoinConfigurationError(ConjoinError):
    def __init__(self, message: str) -> None:
        super().__init__(message, code="configuration_error")


class ConjoinConnectionError(ConjoinError):
    def __init__(self, message: str) -> None:
        super().__init__(message, code="connection_error")


class ConjoinTimeoutError(ConjoinError):
    def __init__(self, message: str) -> None:
        super().__init__(message, code="timeout_error")


class ConjoinStatusError(ConjoinError):
    body: str | None

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        code: str = "api_error",
        request_id: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(message, status_code=status_code, code=code, request_id=request_id)
        self.body = body


class ConjoinAuthenticationError(ConjoinStatusError):
    def __init__(
        self,
        message: str,
        *,
        request_id: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=401,
            code="authentication_error",
            request_id=request_id,
            body=body,
        )


class ConjoinPermissionDeniedError(ConjoinStatusError):
    def __init__(
        self,
        message: str,
        *,
        request_id: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=403,
            code="permission_denied_error",
            request_id=request_id,
            body=body,
        )


class ConjoinNotFoundError(ConjoinStatusError):
    def __init__(
        self,
        message: str,
        *,
        request_id: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=404,
            code="not_found_error",
            request_id=request_id,
            body=body,
        )


class ConjoinValidationError(ConjoinStatusError):
    errors: tuple[ValidationFieldError, ...]

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        errors: Sequence[ValidationFieldError] = (),
        request_id: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=status_code,
            code="validation_error",
            request_id=request_id,
            body=body,
        )
        self.errors = tuple(errors)


class ConjoinRateLimitError(ConjoinStatusError):
    retry_after: float | None

    def __init__(
        self,
        message: str,
        *,
        retry_after: float | None = None,
        request_id: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=429,
            code="rate_limit_error",
            request_id=request_id,
            body=body,
        )
        self.retry_after = retry_after


class ConjoinInternalServerError(ConjoinStatusError):
    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        request_id: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=status_code,
            code="internal_server_error",
            request_id=request_id,
            body=body,
        )


class ConjoinResponseValidationError(ConjoinError):
    status_code: int
    body: str

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        request_id: str | None,
        body: str,
    ) -> None:
        super().__init__(
            message,
            status_code=status_code,
            code="response_validation_error",
            request_id=request_id,
        )
        self.body = body


class ConjoinStorageError(ConjoinError):
    body: str | None
    storage_url: str
    upload_mode: str | None

    def __init__(
        self,
        message: str,
        *,
        status_code: int,
        storage_url: str,
        upload_mode: str | None = None,
        body: str | None = None,
    ) -> None:
        super().__init__(
            message,
            status_code=status_code,
            code="storage_error",
        )
        self.body = body
        self.storage_url = storage_url
        self.upload_mode = upload_mode

    @property
    def status(self) -> int:
        return self.status_code
