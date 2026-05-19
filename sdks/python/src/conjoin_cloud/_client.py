from __future__ import annotations

from collections.abc import Mapping
from typing import Any, TypeVar, overload

import httpx

from conjoin_cloud._config import ResolvedConfig, resolve_config
from conjoin_cloud._errors import ConjoinConfigurationError
from conjoin_cloud._request_options import RequestOptions
from conjoin_cloud._response import WithResponse
from conjoin_cloud._transport import (
    create_with_response,
    parse_response_data,
    raise_for_error_response,
    send_request,
)

T = TypeVar("T")


class Conjoin:
    config: ResolvedConfig

    def __init__(
        self,
        *,
        api_key: str | None = None,
        publishable_key: str | None = None,
        base_url: str | None = None,
        api_version: str | None = None,
        timeout: float | None = None,
        max_retries: int | None = None,
        backoff_seconds: float | None = None,
        http_client: httpx.Client | None = None,
        strict_response_validation: bool = False,
    ) -> None:
        if isinstance(http_client, httpx.AsyncClient):
            raise ConjoinConfigurationError(
                "Conjoin requires an httpx.Client, not httpx.AsyncClient"
            )

        self.config = resolve_config(
            api_key=api_key,
            publishable_key=publishable_key,
            base_url=base_url,
            api_version=api_version,
            timeout=timeout,
            max_retries=max_retries,
            backoff_seconds=backoff_seconds,
            strict_response_validation=strict_response_validation,
        )
        self._client = http_client if http_client is not None else httpx.Client()
        self._owns_client = http_client is None
        self.with_response = _ConjoinWithResponse(self)

    @overload
    def request(
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
    def request(
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

    def request(
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
        response = send_request(
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

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> Conjoin:
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        self.close()


class _ConjoinWithResponse:
    def __init__(self, client: Conjoin) -> None:
        self._client = client

    def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, Any] | None = None,
        body: Any = None,
        cast_to: Any = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> WithResponse[Any]:
        result = self._client.request(
            method,
            path,
            query=query,
            body=body,
            cast_to=cast_to,
            request_options=request_options,
            with_response=True,
        )
        return result
