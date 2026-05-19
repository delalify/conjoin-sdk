from __future__ import annotations

import asyncio
import re
import time
from collections.abc import Mapping
from email.utils import parsedate_to_datetime
from typing import Any, get_origin
from urllib.parse import urlencode

import httpx
from pydantic import TypeAdapter, ValidationError

from conjoin_cloud._config import ResolvedConfig
from conjoin_cloud._errors import (
    ConjoinAuthenticationError,
    ConjoinConfigurationError,
    ConjoinConnectionError,
    ConjoinError,
    ConjoinInternalServerError,
    ConjoinNotFoundError,
    ConjoinPermissionDeniedError,
    ConjoinRateLimitError,
    ConjoinResponseValidationError,
    ConjoinStatusError,
    ConjoinTimeoutError,
    ConjoinValidationError,
    ValidationFieldError,
)
from conjoin_cloud._models import ConjoinModel, Page
from conjoin_cloud._multipart import MultipartBody
from conjoin_cloud._request_options import (
    RequestOptions,
    coerce_request_options,
    resolve_auth_override,
)
from conjoin_cloud._response import WithResponse, preview_body
from conjoin_cloud._version import __version__

CONJOIN_REQUEST_ID_HEADER = "Conjoin-Request-Id"
REQUEST_ID_PREFIX = "cnj_req_"
REQUEST_ID_PATTERN = re.compile(
    r"^cnj_req_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
SDK_VERSION_HEADER = "X-Conjoin-SDK-Version"
API_VERSION_HEADER = "X-Conjoin-API-Version"

RETRYABLE_STATUSES = frozenset({429})
MANAGED_HEADERS = frozenset(
    {"authorization", "content-type", CONJOIN_REQUEST_ID_HEADER.lower()}
)


def build_url(config: ResolvedConfig, path: str, query: Mapping[str, Any] | None) -> str:
    normalized_path = path.strip()
    if not normalized_path:
        raise ConjoinConfigurationError("path must not be empty")

    if normalized_path.startswith("http://") or normalized_path.startswith("https://"):
        raise ConjoinConfigurationError("path must be relative to the Conjoin API")

    base = f"{config.base_url}/v1/{normalized_path.lstrip('/')}"

    if not query:
        return base

    pairs = list(_flatten_query(query))
    if not pairs:
        return base

    separator = "&" if "?" in base else "?"
    return f"{base}{separator}{urlencode(pairs)}"


def build_headers(
    config: ResolvedConfig,
    options: RequestOptions,
    *,
    content_type: str | None = "application/json",
) -> dict[str, str]:
    auth = resolve_auth_override(options.auth)
    headers: dict[str, str] = {
        SDK_VERSION_HEADER: __version__,
        API_VERSION_HEADER: config.api_version,
    }
    if content_type is not None:
        headers["Content-Type"] = content_type

    authorization = _resolve_authorization(config, auth.type, auth.token)
    if authorization is not None:
        headers["Authorization"] = authorization

    request_id_from_headers = _extract_request_id(options.headers)
    extra_headers = _safe_extra_headers(options.headers)
    headers.update(extra_headers)

    request_id = _select_request_id(options.conjoin_request_id, request_id_from_headers)
    if request_id is not None:
        headers[CONJOIN_REQUEST_ID_HEADER] = request_id

    return headers


def should_retry_status(status_code: int) -> bool:
    return status_code in RETRYABLE_STATUSES or status_code >= 500


def calculate_retry_delay(
    response: httpx.Response | None,
    config: ResolvedConfig,
    attempt: int,
) -> float:
    if response is not None:
        retry_after = parse_retry_after(response.headers.get("Retry-After"))
        if retry_after is not None:
            return retry_after

    return config.backoff_seconds * (2**attempt)


def parse_retry_after(value: str | None) -> float | None:
    if value is None:
        return None

    stripped = value.strip()
    if not stripped:
        return None

    try:
        return max(0.0, float(stripped))
    except ValueError:
        pass

    try:
        retry_at = parsedate_to_datetime(stripped)
    except (TypeError, ValueError):
        return None

    return max(0.0, retry_at.timestamp() - time.time())


def parse_response_data(
    response: httpx.Response,
    *,
    cast_to: Any,
    strict: bool,
) -> Any:
    request_id = get_response_request_id(response)
    body_text = response.text

    if not body_text:
        data: Any = None
    else:
        try:
            payload = response.json()
        except ValueError as exc:
            raise ConjoinResponseValidationError(
                "Response body was not valid JSON",
                status_code=response.status_code,
                request_id=request_id,
                body=preview_body(body_text),
            ) from exc

        if _cast_expects_envelope(cast_to):
            data = payload
        elif isinstance(payload, dict) and "data" in payload:
            data = payload["data"]
        else:
            data = payload

    parsed = _parse_cast(data, cast_to=cast_to, strict=strict, response=response)
    attach_request_id(parsed, request_id)
    return parsed


def attach_request_id(value: Any, request_id: str | None) -> None:
    if isinstance(value, ConjoinModel):
        value._set_request_id(request_id)

    if isinstance(value, Page):
        for item in value.data:
            attach_request_id(item, request_id)


def get_response_request_id(response: httpx.Response) -> str | None:
    return _select_request_id(response.headers.get(CONJOIN_REQUEST_ID_HEADER))


def create_with_response(response: httpx.Response, data: Any) -> WithResponse[Any]:
    return WithResponse(
        data=data,
        status_code=response.status_code,
        headers=dict(response.headers),
        request_id=get_response_request_id(response),
    )


def raise_for_error_response(response: httpx.Response) -> None:
    if response.status_code < 400:
        return

    request_id = get_response_request_id(response)
    body = preview_body(response.text)
    payload = _try_parse_error_json(response)
    message = _error_message(payload, response)

    if response.status_code == 401:
        raise ConjoinAuthenticationError(message, request_id=request_id, body=body)

    if response.status_code == 403:
        raise ConjoinPermissionDeniedError(message, request_id=request_id, body=body)

    if response.status_code == 404:
        raise ConjoinNotFoundError(message, request_id=request_id, body=body)

    if response.status_code in (400, 422):
        raise ConjoinValidationError(
            message,
            status_code=response.status_code,
            errors=_validation_errors(payload),
            request_id=request_id,
            body=body,
        )

    if response.status_code == 429:
        raise ConjoinRateLimitError(
            message,
            retry_after=parse_retry_after(response.headers.get("Retry-After")),
            request_id=request_id,
            body=body,
        )

    if response.status_code >= 500:
        raise ConjoinInternalServerError(
            message,
            status_code=response.status_code,
            request_id=request_id,
            body=body,
        )

    raise ConjoinStatusError(
        message,
        status_code=response.status_code,
        request_id=request_id,
        body=body,
    )


def map_transport_error(error: httpx.HTTPError, *, timeout: float) -> ConjoinError:
    if isinstance(error, httpx.TimeoutException):
        return ConjoinTimeoutError(f"Request timed out after {timeout:g}s")

    return ConjoinConnectionError(str(error) or "Network request failed")


def send_request(
    client: httpx.Client,
    config: ResolvedConfig,
    method: str,
    path: str,
    *,
    query: Mapping[str, Any] | None,
    body: Any,
    request_options: RequestOptions | Mapping[str, Any] | None,
) -> httpx.Response:
    options = coerce_request_options(request_options)
    timeout = _resolve_timeout(config, options)
    max_retries = _resolve_max_retries(config, options)
    url = build_url(config, path, query)
    headers = build_headers(
        config,
        options,
        content_type=None if isinstance(body, MultipartBody) else "application/json",
    )
    request_kwargs = _build_request_body_kwargs(body)
    last_error: ConjoinError | None = None

    for attempt in range(max_retries + 1):
        try:
            response = client.request(
                method.upper(),
                url,
                headers=headers,
                timeout=timeout,
                **request_kwargs,
            )
        except httpx.HTTPError as exc:
            last_error = map_transport_error(exc, timeout=timeout)
            if attempt >= max_retries:
                raise last_error from exc
            time.sleep(calculate_retry_delay(None, config, attempt))
            continue

        if should_retry_status(response.status_code) and attempt < max_retries:
            time.sleep(calculate_retry_delay(response, config, attempt))
            continue

        return response

    if last_error is not None:
        raise last_error

    raise ConjoinConnectionError("Network request failed")


async def send_async_request(
    client: httpx.AsyncClient,
    config: ResolvedConfig,
    method: str,
    path: str,
    *,
    query: Mapping[str, Any] | None,
    body: Any,
    request_options: RequestOptions | Mapping[str, Any] | None,
) -> httpx.Response:
    options = coerce_request_options(request_options)
    timeout = _resolve_timeout(config, options)
    max_retries = _resolve_max_retries(config, options)
    url = build_url(config, path, query)
    headers = build_headers(
        config,
        options,
        content_type=None if isinstance(body, MultipartBody) else "application/json",
    )
    request_kwargs = _build_request_body_kwargs(body)
    last_error: ConjoinError | None = None

    for attempt in range(max_retries + 1):
        try:
            response = await client.request(
                method.upper(),
                url,
                headers=headers,
                timeout=timeout,
                **request_kwargs,
            )
        except httpx.HTTPError as exc:
            last_error = map_transport_error(exc, timeout=timeout)
            if attempt >= max_retries:
                raise last_error from exc
            await asyncio.sleep(calculate_retry_delay(None, config, attempt))
            continue

        if should_retry_status(response.status_code) and attempt < max_retries:
            await asyncio.sleep(calculate_retry_delay(response, config, attempt))
            continue

        return response

    if last_error is not None:
        raise last_error

    raise ConjoinConnectionError("Network request failed")


def _resolve_timeout(config: ResolvedConfig, options: RequestOptions) -> float:
    if options.timeout is None:
        return config.timeout

    timeout = float(options.timeout)
    if timeout <= 0:
        raise ConjoinConfigurationError("request_options.timeout must be greater than 0")
    return timeout


def _resolve_max_retries(config: ResolvedConfig, options: RequestOptions) -> int:
    if options.max_retries is None:
        return config.max_retries

    max_retries = int(options.max_retries)
    if max_retries < 0:
        raise ConjoinConfigurationError(
            "request_options.max_retries must be greater than or equal to 0"
        )
    return max_retries


def _parse_cast(data: Any, *, cast_to: Any, strict: bool, response: httpx.Response) -> Any:
    if cast_to is None:
        return data

    try:
        return TypeAdapter(cast_to).validate_python(data, strict=strict)
    except ValidationError as exc:
        raise ConjoinResponseValidationError(
            "Response body did not match the expected schema",
            status_code=response.status_code,
            request_id=get_response_request_id(response),
            body=preview_body(response.text),
        ) from exc


def _build_request_body_kwargs(body: Any) -> dict[str, Any]:
    if isinstance(body, MultipartBody):
        return {"files": body.to_httpx_files()}

    return {"json": body}


def _cast_expects_envelope(cast_to: Any) -> bool:
    origin = get_origin(cast_to) or cast_to
    try:
        return isinstance(origin, type) and issubclass(origin, Page)
    except TypeError:
        return False


def _try_parse_error_json(response: httpx.Response) -> Mapping[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {}

    if isinstance(payload, Mapping):
        return payload
    return {}


def _error_message(payload: Mapping[str, Any], response: httpx.Response) -> str:
    message = payload.get("message")
    if isinstance(message, str) and message.strip():
        return message

    if response.reason_phrase:
        return response.reason_phrase

    return f"Conjoin API request failed with status {response.status_code}"


def _validation_errors(payload: Mapping[str, Any]) -> tuple[ValidationFieldError, ...]:
    errors = payload.get("errors")
    if not isinstance(errors, list):
        return ()

    parsed: list[ValidationFieldError] = []
    for error in errors:
        if not isinstance(error, Mapping):
            continue

        message = error.get("message")
        path = error.get("path")
        if isinstance(message, str) and isinstance(path, str):
            parsed.append(ValidationFieldError(message=message, path=path))

    return tuple(parsed)


def _resolve_authorization(config: ResolvedConfig, auth_type: str, token: str | None) -> str | None:
    if auth_type == "none":
        return None

    if auth_type == "bearer":
        if token is None or not token.strip():
            raise ConjoinAuthenticationError("Bearer token must not be empty")
        return f"Bearer {token.strip()}"

    if auth_type != "default":
        raise ConjoinConfigurationError(
            "request_options.auth.type must be default, none, or bearer"
        )

    return f"Bearer {config.auth_token}"


def _safe_extra_headers(headers: Mapping[str, str] | None) -> dict[str, str]:
    if headers is None:
        return {}

    safe: dict[str, str] = {}
    for name, value in headers.items():
        normalized = name.lower()
        if normalized in MANAGED_HEADERS:
            continue

        safe[str(name)] = str(value)

    return safe


def _extract_request_id(headers: Mapping[str, str] | None) -> str | None:
    if headers is None:
        return None

    for name, value in headers.items():
        if name.lower() == CONJOIN_REQUEST_ID_HEADER.lower():
            return str(value)

    return None


def _select_request_id(*values: str | None) -> str | None:
    for value in values:
        if isinstance(value, str) and _is_valid_request_id(value):
            return value
    return None


def _is_valid_request_id(value: str) -> bool:
    return bool(REQUEST_ID_PATTERN.fullmatch(value))


def _flatten_query(query: Mapping[str, Any]) -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    for key, value in query.items():
        _append_query_value(pairs, str(key), value)
    return pairs


def _append_query_value(pairs: list[tuple[str, str]], key: str, value: Any) -> None:
    if value is None:
        return

    if isinstance(value, (list, tuple)):
        for item in value:
            _append_query_value(pairs, key, item)
        return

    if isinstance(value, Mapping):
        for nested_key, nested_value in value.items():
            _append_query_value(pairs, f"{key}[{nested_key}]", nested_value)
        return

    pairs.append((key, str(value)))
