from __future__ import annotations

import inspect
from collections.abc import Awaitable, Callable, Mapping
from typing import Any, TypeVar, cast, overload

import httpx

from conjoin_cloud._config import ResolvedConfig, resolve_config
from conjoin_cloud._errors import ConjoinConfigurationError
from conjoin_cloud._request_options import RequestOptions
from conjoin_cloud._request_tracing import resolve_conjoin_request_id
from conjoin_cloud._response import WithResponse
from conjoin_cloud._transport import (
    create_with_response,
    parse_response_data,
    raise_for_error_response,
    send_async_request,
)
from conjoin_cloud.generated import AsyncGeneratedResourcesMixin

T = TypeVar("T")


class AsyncConjoin(AsyncGeneratedResourcesMixin):
    config: ResolvedConfig

    def __init__(
        self,
        *,
        api_key: str | None = None,
        publishable_key: str | None = None,
        base_url: str | None = None,
        api_version: str | None = None,
        timeout: float | None = None,
        conjoin_request_id: str | None = None,
        max_retries: int | None = None,
        backoff_seconds: float | None = None,
        http_client: httpx.AsyncClient | None = None,
        strict_response_validation: bool = False,
    ) -> None:
        if isinstance(http_client, httpx.Client):
            raise ConjoinConfigurationError(
                "AsyncConjoin requires an httpx.AsyncClient, not httpx.Client"
            )

        self.config = resolve_config(
            api_key=api_key,
            publishable_key=publishable_key,
            base_url=base_url,
            api_version=api_version,
            timeout=timeout,
            conjoin_request_id=conjoin_request_id,
            max_retries=max_retries,
            backoff_seconds=backoff_seconds,
            strict_response_validation=strict_response_validation,
        )
        self._client = http_client if http_client is not None else httpx.AsyncClient()
        self._owns_client = http_client is None
        self.with_response = _AsyncConjoinWithResponse(self)
        self._init_generated_resources()

    @overload
    async def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, Any] | None = None,
        body: Any = None,
        cast_to: type[T],
        request_options: RequestOptions | Mapping[str, Any] | None = None,
        with_response: bool = False,
    ) -> T: ...

    @overload
    async def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, Any] | None = None,
        body: Any = None,
        cast_to: Any = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
        with_response: bool = False,
    ) -> Any: ...

    async def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, Any] | None = None,
        body: Any = None,
        cast_to: Any = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
        with_response: bool = False,
    ) -> Any:
        response = await send_async_request(
            self._client,
            self.config,
            method,
            path,
            query=query,
            body=body,
            request_options=request_options,
        )
        raise_for_error_response(response)
        data = parse_response_data(
            response,
            cast_to=cast_to,
            strict=self.config.strict_response_validation,
        )

        if with_response:
            return create_with_response(response, data)

        return data

    async def with_request_trace(
        self,
        callback: Callable[[AsyncConjoin, str], T | Awaitable[T]],
        request_id: str | None = None,
    ) -> T:
        resolved_request_id = resolve_conjoin_request_id(
            request_id if request_id is not None else self.config.conjoin_request_id
        )
        scoped_client = AsyncConjoin(
            api_key=self.config.api_key,
            publishable_key=self.config.publishable_key,
            base_url=self.config.base_url,
            api_version=self.config.api_version,
            timeout=self.config.timeout,
            conjoin_request_id=resolved_request_id,
            max_retries=self.config.max_retries,
            backoff_seconds=self.config.backoff_seconds,
            http_client=self._client,
            strict_response_validation=self.config.strict_response_validation,
        )
        result = callback(scoped_client, resolved_request_id)

        if inspect.isawaitable(result):
            return await result

        return cast(T, result)

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def __aenter__(self) -> AsyncConjoin:
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> None:
        await self.aclose()


class _AsyncConjoinWithResponse:
    def __init__(self, client: AsyncConjoin) -> None:
        self._client = client

    async def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, Any] | None = None,
        body: Any = None,
        cast_to: Any = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> WithResponse[Any]:
        result = await self._client.request(
            method,
            path,
            query=query,
            body=body,
            cast_to=cast_to,
            request_options=request_options,
            with_response=True,
        )
        return result
