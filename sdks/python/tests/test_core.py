from __future__ import annotations

import asyncio
from collections.abc import Callable
from typing import Any

import httpx
import pytest
from pydantic import Field

from conjoin_cloud import (
    DEFAULT_API_VERSION,
    AsyncConjoin,
    AuthOverride,
    Conjoin,
    ConjoinAuthenticationError,
    ConjoinConfigurationError,
    ConjoinConnectionError,
    ConjoinInternalServerError,
    ConjoinModel,
    ConjoinNotFoundError,
    ConjoinPermissionDeniedError,
    ConjoinRateLimitError,
    ConjoinResponseValidationError,
    ConjoinTimeoutError,
    ConjoinValidationError,
    Page,
    RequestOptions,
)
from conjoin_cloud._multipart import MultipartBody
from conjoin_cloud._transport import CONJOIN_REQUEST_ID_HEADER

VALID_REQUEST_ID = "cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1"


class Widget(ConjoinModel):
    id: str
    display_name: str = Field(alias="display_name")


def json_response(
    request: httpx.Request,
    status_code: int = 200,
    payload: Any | None = None,
) -> httpx.Response:
    return httpx.Response(
        status_code,
        json={"data": {"id": "wgt_123", "display_name": "Test"}} if payload is None else payload,
        headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
        request=request,
    )


def make_client(handler: Callable[[httpx.Request], httpx.Response], **kwargs: Any) -> Conjoin:
    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    return Conjoin(api_key="ck_test_123", http_client=http_client, max_retries=0, **kwargs)


def make_async_client(
    handler: Callable[[httpx.Request], httpx.Response],
    **kwargs: Any,
) -> AsyncConjoin:
    http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return AsyncConjoin(api_key="ck_test_123", http_client=http_client, max_retries=0, **kwargs)


def test_explicit_api_key_auth_sends_bearer_header() -> None:
    seen_headers: httpx.Headers | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_headers
        seen_headers = request.headers
        return json_response(request)

    client = make_client(handler)

    try:
        client.request("GET", "billing/customers")
    finally:
        client.close()

    assert seen_headers is not None
    assert seen_headers["Authorization"] == "Bearer ck_test_123"


def test_explicit_publishable_key_auth_sends_bearer_header() -> None:
    seen_headers: httpx.Headers | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_headers
        seen_headers = request.headers
        return json_response(request)

    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    client = Conjoin(publishable_key="pk_test_123", http_client=http_client)

    try:
        client.request("GET", "cloud/sdk-config")
    finally:
        client.close()

    assert seen_headers is not None
    assert seen_headers["Authorization"] == "Bearer pk_test_123"


def test_env_credential_fallback_prefers_explicit_args(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CONJOIN_API_KEY", "ck_env_123")
    monkeypatch.setenv("CONJOIN_PUBLISHABLE_KEY", "pk_env_ignored")

    client = Conjoin(api_key="ck_explicit_123")

    try:
        assert client.config.api_key == "ck_explicit_123"
        assert client.config.publishable_key is None
    finally:
        client.close()


def test_env_credential_fallback_uses_single_env_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CONJOIN_API_KEY", "ck_env_123")
    monkeypatch.delenv("CONJOIN_PUBLISHABLE_KEY", raising=False)

    client = Conjoin()

    try:
        assert client.config.api_key == "ck_env_123"
    finally:
        client.close()


@pytest.mark.parametrize(
    ("kwargs", "env"),
    [
        ({}, {}),
        ({"api_key": " "}, {}),
        ({"api_key": "ck_test_123", "publishable_key": "pk_test_123"}, {}),
        ({}, {"CONJOIN_API_KEY": "ck_env_123", "CONJOIN_PUBLISHABLE_KEY": "pk_env_123"}),
    ],
)
def test_rejects_missing_blank_or_conflicting_credentials(
    monkeypatch: pytest.MonkeyPatch,
    kwargs: dict[str, Any],
    env: dict[str, str],
) -> None:
    monkeypatch.delenv("CONJOIN_API_KEY", raising=False)
    monkeypatch.delenv("CONJOIN_PUBLISHABLE_KEY", raising=False)
    for name, value in env.items():
        monkeypatch.setenv(name, value)

    with pytest.raises(ConjoinConfigurationError):
        Conjoin(**kwargs)


def test_default_and_custom_api_version_headers() -> None:
    seen_versions: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_versions.append(request.headers["X-Conjoin-API-Version"])
        return json_response(request)

    default_client = make_client(handler)
    custom_client = make_client(handler, api_version="2026-07-01")

    try:
        default_client.request("GET", "billing/customers")
        custom_client.request("GET", "billing/customers")
    finally:
        default_client.close()
        custom_client.close()

    assert seen_versions == [DEFAULT_API_VERSION, "2026-07-01"]


def test_request_id_is_omitted_by_default_and_included_when_supplied() -> None:
    seen_request_ids: list[str | None] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_request_ids.append(request.headers.get(CONJOIN_REQUEST_ID_HEADER))
        return json_response(request)

    client = make_client(handler)

    try:
        client.request("GET", "billing/customers")
        client.request(
            "GET",
            "billing/customers",
            request_options=RequestOptions(conjoin_request_id=VALID_REQUEST_ID),
        )
    finally:
        client.close()

    assert seen_request_ids == [None, VALID_REQUEST_ID]


def test_rejects_absolute_request_paths_to_protect_managed_auth_headers() -> None:
    client = make_client(json_response)

    try:
        with pytest.raises(ConjoinConfigurationError):
            client.request("GET", "https://example.com/steal")
    finally:
        client.close()


def test_safe_extra_headers_strip_managed_headers_and_allow_auth_override() -> None:
    seen_headers: httpx.Headers | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_headers
        seen_headers = request.headers
        return json_response(request)

    client = make_client(handler)

    try:
        client.request(
            "GET",
            "auth/scim/v2/project_123/app_123/Users",
            request_options=RequestOptions(
                headers={
                    "Authorization": "Bearer attacker",
                    CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID,
                    "X-Custom": "yes",
                },
                auth=AuthOverride(type="bearer", token="scim_token_123"),
            ),
        )
    finally:
        client.close()

    assert seen_headers is not None
    assert seen_headers["Authorization"] == "Bearer scim_token_123"
    assert seen_headers[CONJOIN_REQUEST_ID_HEADER] == VALID_REQUEST_ID
    assert seen_headers["X-Custom"] == "yes"


def test_auth_none_omits_authorization() -> None:
    seen_headers: httpx.Headers | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_headers
        seen_headers = request.headers
        return json_response(request)

    client = make_client(handler)

    try:
        client.request(
            "GET",
            "auth/scim/v2/ServiceProviderConfig",
            request_options=RequestOptions(auth=AuthOverride(type="none")),
        )
    finally:
        client.close()

    assert seen_headers is not None
    assert "Authorization" not in seen_headers


def test_multipart_body_uses_httpx_multipart_without_managed_content_type() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(request)

    client = make_client(handler)

    try:
        client.request(
            "POST",
            "messaging/email/send",
            body=MultipartBody({"subject": "Hello", "to": ["user@example.com"]}),
            request_options=RequestOptions(headers={"Content-Type": "application/json"}),
        )
    finally:
        client.close()

    assert seen_request is not None
    content_type = seen_request.headers["Content-Type"]
    assert content_type.startswith("multipart/form-data; boundary=")
    assert "application/json" not in content_type
    assert b'name="subject"' in seen_request.content
    assert b"Hello" in seen_request.content


def test_retries_429_and_respects_retry_after_without_changing_request_id() -> None:
    seen_request_ids: list[str | None] = []
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        seen_request_ids.append(request.headers.get(CONJOIN_REQUEST_ID_HEADER))
        if attempts == 1:
            return httpx.Response(
                429,
                json={"message": "Slow down"},
                headers={"Retry-After": "0"},
                request=request,
            )
        return json_response(request)

    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    client = Conjoin(
        api_key="ck_test_123",
        http_client=http_client,
        max_retries=2,
        backoff_seconds=0,
    )

    try:
        result = client.request(
            "GET",
            "billing/customers",
            request_options=RequestOptions(conjoin_request_id=VALID_REQUEST_ID),
        )
    finally:
        client.close()

    assert result["id"] == "wgt_123"
    assert attempts == 2
    assert seen_request_ids == [VALID_REQUEST_ID, VALID_REQUEST_ID]


def test_retries_500_then_succeeds() -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            return httpx.Response(500, json={"message": "Failed"}, request=request)
        return json_response(request)

    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    client = Conjoin(
        api_key="ck_test_123",
        http_client=http_client,
        max_retries=1,
        backoff_seconds=0,
    )

    try:
        result = client.request("GET", "billing/customers")
    finally:
        client.close()

    assert result["id"] == "wgt_123"
    assert attempts == 2


def test_does_not_retry_non_retryable_statuses() -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(401, json={"message": "Unauthorized"}, request=request)

    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    client = Conjoin(
        api_key="ck_test_123",
        http_client=http_client,
        max_retries=3,
        backoff_seconds=0,
    )

    try:
        with pytest.raises(ConjoinAuthenticationError):
            client.request("GET", "billing/customers")
    finally:
        client.close()

    assert attempts == 1


def test_retries_network_errors_then_succeeds() -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        if attempts == 1:
            raise httpx.ConnectError("connection failed", request=request)
        return json_response(request)

    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    client = Conjoin(
        api_key="ck_test_123",
        http_client=http_client,
        max_retries=1,
        backoff_seconds=0,
    )

    try:
        result = client.request("GET", "billing/customers")
    finally:
        client.close()

    assert result["id"] == "wgt_123"
    assert attempts == 2


@pytest.mark.parametrize(
    ("status_code", "expected_error"),
    [
        (400, ConjoinValidationError),
        (401, ConjoinAuthenticationError),
        (403, ConjoinPermissionDeniedError),
        (404, ConjoinNotFoundError),
        (422, ConjoinValidationError),
        (429, ConjoinRateLimitError),
        (500, ConjoinInternalServerError),
    ],
)
def test_status_error_mapping(status_code: int, expected_error: type[Exception]) -> None:
    attempts = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal attempts
        attempts += 1
        return httpx.Response(status_code, json={"message": "Failed"}, request=request)

    client = make_client(handler)

    try:
        with pytest.raises(expected_error):
            client.request("GET", "billing/customers")
    finally:
        client.close()

    assert attempts == 1


def test_timeout_and_connection_error_mapping() -> None:
    def timeout_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out", request=request)

    def connection_handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection failed", request=request)

    timeout_client = make_client(timeout_handler)
    connection_client = make_client(connection_handler)

    try:
        with pytest.raises(ConjoinTimeoutError):
            timeout_client.request("GET", "billing/customers")
        with pytest.raises(ConjoinConnectionError):
            connection_client.request("GET", "billing/customers")
    finally:
        timeout_client.close()
        connection_client.close()


def test_injected_client_is_not_closed_and_owned_client_is_closed() -> None:
    injected = httpx.Client(transport=httpx.MockTransport(json_response))
    client = Conjoin(api_key="ck_test_123", http_client=injected)
    owned = Conjoin(api_key="ck_test_123")

    client.close()
    owned.close()

    assert not injected.is_closed
    assert owned._client.is_closed

    injected.close()


def test_context_manager_closes_owned_client() -> None:
    with Conjoin(api_key="ck_test_123") as client:
        owned_http_client = client._client

    assert owned_http_client.is_closed


def test_rejects_wrong_http_client_kind() -> None:
    async_client = httpx.AsyncClient()
    sync_client = httpx.Client()

    try:
        with pytest.raises(ConjoinConfigurationError):
            Conjoin(api_key="ck_test_123", http_client=async_client)  # type: ignore[arg-type]
        with pytest.raises(ConjoinConfigurationError):
            AsyncConjoin(api_key="ck_test_123", http_client=sync_client)  # type: ignore[arg-type]
    finally:
        asyncio.run(async_client.aclose())
        sync_client.close()


def test_with_response_and_base_model_metadata() -> None:
    client = make_client(json_response)

    try:
        result = client.with_response.request("GET", "widgets/wgt_123", cast_to=Widget)
    finally:
        client.close()

    assert result.status_code == 200
    assert result.request_id == VALID_REQUEST_ID
    assert result.data.id == "wgt_123"
    assert result.data._request_id == VALID_REQUEST_ID
    assert result.data.model_dump(by_alias=True)["display_name"] == "Test"


def test_page_model_preserves_cursor_and_request_id() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "data": [{"id": "wgt_123", "display_name": "Test"}],
                "cursor": {"next": "cursor_123"},
            },
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    client = make_client(handler)

    try:
        page = client.request("GET", "widgets", cast_to=Page[Widget])
    finally:
        client.close()

    assert page.cursor is not None
    assert page.cursor.next == "cursor_123"
    assert page._request_id == VALID_REQUEST_ID


def test_response_validation_error_includes_metadata() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={"data": {"display_name": "missing id"}},
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    client = make_client(handler)

    try:
        with pytest.raises(ConjoinResponseValidationError) as exc_info:
            client.request("GET", "widgets/wgt_123", cast_to=Widget)
    finally:
        client.close()

    assert exc_info.value.status_code == 200
    assert exc_info.value.request_id == VALID_REQUEST_ID
    assert "missing id" in exc_info.value.body


def test_async_client_matches_core_request_behavior() -> None:
    seen_headers: list[httpx.Headers] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_headers.append(request.headers)
        return json_response(request)

    async def run() -> None:
        client = make_async_client(handler)
        try:
            result = await client.with_response.request(
                "GET",
                "widgets/wgt_123",
                cast_to=Widget,
                request_options={"conjoin_request_id": VALID_REQUEST_ID},
            )
        finally:
            await client.aclose()

        assert result.data.id == "wgt_123"
        assert result.request_id == VALID_REQUEST_ID

    asyncio.run(run())

    assert seen_headers[0][CONJOIN_REQUEST_ID_HEADER] == VALID_REQUEST_ID


def test_async_context_manager_closes_owned_client() -> None:
    async def run() -> httpx.AsyncClient:
        async with AsyncConjoin(api_key="ck_test_123") as client:
            return client._client

    owned_http_client = asyncio.run(run())

    assert owned_http_client.is_closed
