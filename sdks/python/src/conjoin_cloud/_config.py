from __future__ import annotations

from dataclasses import dataclass
from os import environ

from conjoin_cloud._constants import DEFAULT_API_VERSION
from conjoin_cloud._errors import ConjoinConfigurationError

DEFAULT_BASE_URL = "https://api.conjoin.cloud"
DEFAULT_TIMEOUT_SECONDS = 30.0
DEFAULT_MAX_RETRIES = 3
DEFAULT_BACKOFF_SECONDS = 0.5

CONJOIN_API_KEY_ENV = "CONJOIN_API_KEY"
CONJOIN_PUBLISHABLE_KEY_ENV = "CONJOIN_PUBLISHABLE_KEY"


@dataclass(frozen=True)
class ResolvedConfig:
    api_key: str | None
    publishable_key: str | None
    base_url: str
    api_version: str
    timeout: float
    conjoin_request_id: str | None
    max_retries: int
    backoff_seconds: float
    strict_response_validation: bool

    @property
    def auth_token(self) -> str:
        token = self.api_key if self.api_key is not None else self.publishable_key
        if token is None:
            raise ConjoinConfigurationError("Either api_key or publishable_key must be provided")
        return token


def resolve_config(
    *,
    api_key: str | None,
    publishable_key: str | None,
    base_url: str | None,
    api_version: str | None,
    timeout: float | None,
    conjoin_request_id: str | None,
    max_retries: int | None,
    backoff_seconds: float | None,
    strict_response_validation: bool,
) -> ResolvedConfig:
    resolved_api_key, resolved_publishable_key = _resolve_credentials(
        api_key=api_key,
        publishable_key=publishable_key,
    )

    return ResolvedConfig(
        api_key=resolved_api_key,
        publishable_key=resolved_publishable_key,
        base_url=_resolve_base_url(base_url),
        api_version=_resolve_non_blank("api_version", api_version) or DEFAULT_API_VERSION,
        timeout=_resolve_timeout(timeout),
        conjoin_request_id=conjoin_request_id,
        max_retries=_resolve_max_retries(max_retries),
        backoff_seconds=_resolve_backoff_seconds(backoff_seconds),
        strict_response_validation=strict_response_validation,
    )


def _resolve_credentials(
    *,
    api_key: str | None,
    publishable_key: str | None,
) -> tuple[str | None, str | None]:
    explicit_api_key = _resolve_optional_credential("api_key", api_key)
    explicit_publishable_key = _resolve_optional_credential("publishable_key", publishable_key)

    if explicit_api_key is not None or explicit_publishable_key is not None:
        if explicit_api_key is not None and explicit_publishable_key is not None:
            raise ConjoinConfigurationError("Provide exactly one of api_key or publishable_key")
        return explicit_api_key, explicit_publishable_key

    env_api_key = _resolve_optional_credential(
        CONJOIN_API_KEY_ENV,
        environ.get(CONJOIN_API_KEY_ENV),
    )
    env_publishable_key = _resolve_optional_credential(
        CONJOIN_PUBLISHABLE_KEY_ENV,
        environ.get(CONJOIN_PUBLISHABLE_KEY_ENV),
    )

    if env_api_key is not None and env_publishable_key is not None:
        raise ConjoinConfigurationError(
            f"Only one of {CONJOIN_API_KEY_ENV} or {CONJOIN_PUBLISHABLE_KEY_ENV} may be set"
        )

    if env_api_key is None and env_publishable_key is None:
        raise ConjoinConfigurationError("Either api_key or publishable_key must be provided")

    return env_api_key, env_publishable_key


def _resolve_optional_credential(name: str, value: str | None) -> str | None:
    if value is None:
        return None

    stripped = value.strip()
    if not stripped:
        raise ConjoinConfigurationError(f"{name} must not be empty")

    return stripped


def _resolve_non_blank(name: str, value: str | None) -> str | None:
    if value is None:
        return None

    stripped = value.strip()
    if not stripped:
        raise ConjoinConfigurationError(f"{name} must not be empty")

    return stripped


def _resolve_base_url(value: str | None) -> str:
    base_url = _resolve_non_blank("base_url", value) or DEFAULT_BASE_URL
    return base_url.rstrip("/")


def _resolve_timeout(value: float | None) -> float:
    timeout = DEFAULT_TIMEOUT_SECONDS if value is None else float(value)
    if timeout <= 0:
        raise ConjoinConfigurationError("timeout must be greater than 0")
    return timeout


def _resolve_max_retries(value: int | None) -> int:
    max_retries = DEFAULT_MAX_RETRIES if value is None else int(value)
    if max_retries < 0:
        raise ConjoinConfigurationError("max_retries must be greater than or equal to 0")
    return max_retries


def _resolve_backoff_seconds(value: float | None) -> float:
    backoff_seconds = DEFAULT_BACKOFF_SECONDS if value is None else float(value)
    if backoff_seconds < 0:
        raise ConjoinConfigurationError("backoff_seconds must be greater than or equal to 0")
    return backoff_seconds
