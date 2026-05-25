from __future__ import annotations

import os
from collections.abc import AsyncIterable, AsyncIterator, Callable, Iterable, Iterator, Mapping
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, BinaryIO, TypeGuard, cast

import httpx

from conjoin_cloud._errors import (
    ConjoinConfigurationError,
    ConjoinError,
    ConjoinStorageError,
)
from conjoin_cloud._request_options import RequestOptions, coerce_request_options
from conjoin_cloud._response import preview_body
from conjoin_cloud._transport import (
    _resolve_timeout,
    map_transport_error,
)
from conjoin_cloud.generated._models import StorageObjectCreateUploadSignedUrlRequest
from conjoin_cloud.generated.storage import (
    AsyncStorageResource as GeneratedAsyncStorageResource,
)
from conjoin_cloud.generated.storage import (
    StorageResource as GeneratedStorageResource,
)

if TYPE_CHECKING:
    from conjoin_cloud import AsyncConjoin, Conjoin

CHUNK_ALIGNMENT = 256 * 1024
DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024
STREAM_READ_SIZE = 64 * 1024
STORAGE_MANAGED_HEADERS = frozenset(
    {
        "authorization",
        "conjoin-request-id",
        "content-type",
        "x-conjoin-api-version",
        "x-conjoin-sdk-version",
    }
)

BytesLike = bytes | bytearray | memoryview
PathInput = str | os.PathLike[str]
SyncUploadBody = BytesLike | str | os.PathLike[str] | BinaryIO | Iterable[BytesLike]
AsyncUploadBody = SyncUploadBody | AsyncIterable[BytesLike]
UploadProgressCallback = Callable[["UploadProgress"], None]


@dataclass(frozen=True)
class UploadProgress:
    loaded: int
    total: int
    percentage: int


class StorageDownload:
    def __init__(
        self,
        *,
        url: str,
        response: httpx.Response,
    ) -> None:
        self.url = url
        self.response = response
        self._closed = False

    def read(self) -> bytes:
        try:
            return self.response.read()
        finally:
            self.close()

    def text(self) -> str:
        try:
            self.response.read()
            return self.response.text
        finally:
            self.close()

    def iter_bytes(self, chunk_size: int | None = None) -> Iterator[bytes]:
        try:
            yield from self.response.iter_bytes(chunk_size=chunk_size)
        finally:
            self.close()

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        self.response.close()

    def __enter__(self) -> StorageDownload:
        return self

    def __exit__(self, exc_type: object, exc: object, traceback: object) -> None:
        self.close()


class AsyncStorageDownload:
    def __init__(
        self,
        *,
        url: str,
        response: httpx.Response,
    ) -> None:
        self.url = url
        self.response = response
        self._closed = False

    async def read(self) -> bytes:
        try:
            return await self.response.aread()
        finally:
            await self.aclose()

    async def text(self) -> str:
        try:
            await self.response.aread()
            return self.response.text
        finally:
            await self.aclose()

    async def aiter_bytes(self, chunk_size: int | None = None) -> AsyncIterator[bytes]:
        try:
            async for chunk in self.response.aiter_bytes(chunk_size=chunk_size):
                yield chunk
        finally:
            await self.aclose()

    async def aclose(self) -> None:
        if self._closed:
            return
        self._closed = True
        await self.response.aclose()

    async def __aenter__(self) -> AsyncStorageDownload:
        return self

    async def __aexit__(self, exc_type: object, exc: object, traceback: object) -> None:
        await self.aclose()


class StorageResource(GeneratedStorageResource):
    def __init__(self, client: Conjoin, *, profile_id: str | None = None) -> None:
        super().__init__(client, profile_id=profile_id)

    def upload(
        self,
        *,
        container: str,
        path: str,
        content_type: str,
        body: SyncUploadBody,
        file_size: int | None = None,
        expires_in_minutes: int | None = None,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        on_progress: UploadProgressCallback | None = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> None:
        _validate_storage_request(container=container, path=path, content_type=content_type)
        chunk_size = _validate_chunk_size(chunk_size)
        total_size = _resolve_body_size(body, file_size)
        upload_request = _upload_signed_url_request(
            container=container,
            path=path,
            content_type=content_type,
            file_size=total_size,
            expires_in_minutes=expires_in_minutes,
        )
        signed_url = self.objects.create_upload_signed_url(
            upload_request,
            request_options=request_options,
        )
        upload_url = _validate_signed_url(signed_url.upload_url)
        method, headers = _upload_required_fields(signed_url.required_fields, upload_url)
        timeout = _storage_timeout(self._client, request_options)

        if signed_url.upload_mode == "single":
            _emit_progress(on_progress, loaded=0, total=total_size)
            with _sync_content(body) as content:
                response = _send_sync_storage_request(
                    self._client,
                    method,
                    upload_url,
                    headers=headers,
                    content=content,
                    timeout=timeout,
                    upload_mode="single",
                )
            _raise_for_storage_error(response, upload_url, upload_mode="single", action="Upload")
            _emit_progress(on_progress, loaded=total_size, total=total_size)
            return

        if signed_url.upload_mode != "resumable":
            raise ConjoinStorageError(
                f"Unsupported upload mode: {signed_url.upload_mode}",
                status_code=0,
                storage_url=upload_url,
                upload_mode=signed_url.upload_mode,
            )

        session_url = _initiate_sync_resumable_session(
            self._client,
            upload_url,
            headers=headers,
            timeout=timeout,
        )
        loaded = 0
        _emit_progress(on_progress, loaded=0, total=total_size)

        for chunk in _iter_sync_chunks(body, chunk_size):
            if not chunk:
                continue
            start = loaded
            end = start + len(chunk) - 1
            response = _send_sync_storage_request(
                self._client,
                "PUT",
                session_url,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{total_size}",
                    "Content-Length": str(len(chunk)),
                },
                content=chunk,
                timeout=timeout,
                upload_mode="resumable",
            )
            if response.status_code == 308:
                loaded = _confirmed_resumable_offset(
                    response,
                    expected=end + 1,
                    url=session_url,
                )
            else:
                _raise_for_storage_error(
                    response,
                    session_url,
                    upload_mode="resumable",
                    action="Chunk upload",
                )
                loaded = total_size
            _emit_progress(on_progress, loaded=loaded, total=total_size)

    def download(
        self,
        *,
        container: str,
        path: str,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> StorageDownload:
        _validate_storage_request(container=container, path=path, content_type=None)
        signed_url = self.objects.create_download_signed_url(
            {"container_name_or_id": container, "path": path},
            request_options=request_options,
        )
        url = _validate_signed_url(signed_url.url)
        timeout = _storage_timeout(self._client, request_options)
        headers = _download_headers(signed_url.headers)
        try:
            response = _send_sync_storage_stream_request(
                self._client,
                "GET",
                url,
                headers=headers,
                timeout=timeout,
            )
        except httpx.HTTPError as exc:
            raise map_transport_error(exc, timeout=timeout) from exc

        if response.status_code >= 400:
            try:
                response.read()
                _raise_for_storage_error(response, url, upload_mode=None, action="Download")
            finally:
                response.close()

        return StorageDownload(url=url, response=response)


class AsyncStorageResource(GeneratedAsyncStorageResource):
    def __init__(self, client: AsyncConjoin, *, profile_id: str | None = None) -> None:
        super().__init__(client, profile_id=profile_id)

    async def upload(
        self,
        *,
        container: str,
        path: str,
        content_type: str,
        body: AsyncUploadBody,
        file_size: int | None = None,
        expires_in_minutes: int | None = None,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        on_progress: UploadProgressCallback | None = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> None:
        _validate_storage_request(container=container, path=path, content_type=content_type)
        chunk_size = _validate_chunk_size(chunk_size)
        total_size = _resolve_body_size(body, file_size)
        upload_request = _upload_signed_url_request(
            container=container,
            path=path,
            content_type=content_type,
            file_size=total_size,
            expires_in_minutes=expires_in_minutes,
        )
        signed_url = await self.objects.create_upload_signed_url(
            upload_request,
            request_options=request_options,
        )
        upload_url = _validate_signed_url(signed_url.upload_url)
        method, headers = _upload_required_fields(signed_url.required_fields, upload_url)
        timeout = _storage_timeout(self._client, request_options)

        if signed_url.upload_mode == "single":
            _emit_progress(on_progress, loaded=0, total=total_size)
            async with _async_content(body) as content:
                response = await _send_async_storage_request(
                    self._client,
                    method,
                    upload_url,
                    headers=headers,
                    content=content,
                    timeout=timeout,
                    upload_mode="single",
                )
            _raise_for_storage_error(response, upload_url, upload_mode="single", action="Upload")
            _emit_progress(on_progress, loaded=total_size, total=total_size)
            return

        if signed_url.upload_mode != "resumable":
            raise ConjoinStorageError(
                f"Unsupported upload mode: {signed_url.upload_mode}",
                status_code=0,
                storage_url=upload_url,
                upload_mode=signed_url.upload_mode,
            )

        session_url = await _initiate_async_resumable_session(
            self._client,
            upload_url,
            headers=headers,
            timeout=timeout,
        )
        loaded = 0
        _emit_progress(on_progress, loaded=0, total=total_size)

        async for chunk in _iter_async_chunks(body, chunk_size):
            if not chunk:
                continue
            start = loaded
            end = start + len(chunk) - 1
            response = await _send_async_storage_request(
                self._client,
                "PUT",
                session_url,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{total_size}",
                    "Content-Length": str(len(chunk)),
                },
                content=chunk,
                timeout=timeout,
                upload_mode="resumable",
            )
            if response.status_code == 308:
                loaded = _confirmed_resumable_offset(
                    response,
                    expected=end + 1,
                    url=session_url,
                )
            else:
                _raise_for_storage_error(
                    response,
                    session_url,
                    upload_mode="resumable",
                    action="Chunk upload",
                )
                loaded = total_size
            _emit_progress(on_progress, loaded=loaded, total=total_size)

    async def download(
        self,
        *,
        container: str,
        path: str,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> AsyncStorageDownload:
        _validate_storage_request(container=container, path=path, content_type=None)
        signed_url = await self.objects.create_download_signed_url(
            {"container_name_or_id": container, "path": path},
            request_options=request_options,
        )
        url = _validate_signed_url(signed_url.url)
        timeout = _storage_timeout(self._client, request_options)
        headers = _download_headers(signed_url.headers)
        try:
            response = await _send_async_storage_stream_request(
                self._client,
                "GET",
                url,
                headers=headers,
                timeout=timeout,
            )
        except httpx.HTTPError as exc:
            raise map_transport_error(exc, timeout=timeout) from exc

        if response.status_code >= 400:
            try:
                await response.aread()
                _raise_for_storage_error(response, url, upload_mode=None, action="Download")
            finally:
                await response.aclose()

        return AsyncStorageDownload(url=url, response=response)


def _validate_storage_request(
    *,
    container: str,
    path: str,
    content_type: str | None,
) -> None:
    if not container.strip():
        raise ConjoinConfigurationError("container must not be empty")
    if not path.strip():
        raise ConjoinConfigurationError("path must not be empty")
    if content_type is not None and not content_type.strip():
        raise ConjoinConfigurationError("content_type must not be empty")


def _validate_chunk_size(chunk_size: int) -> int:
    normalized = int(chunk_size)
    if normalized <= 0:
        raise ConjoinConfigurationError("chunk_size must be greater than 0")
    if normalized % CHUNK_ALIGNMENT != 0:
        raise ConjoinConfigurationError(
            f"chunk_size must be a multiple of {CHUNK_ALIGNMENT} bytes (256 KiB)"
        )
    return normalized


def _upload_signed_url_request(
    *,
    container: str,
    path: str,
    content_type: str,
    file_size: int,
    expires_in_minutes: int | None,
) -> StorageObjectCreateUploadSignedUrlRequest:
    request: StorageObjectCreateUploadSignedUrlRequest = {
        "container_name_or_id": container,
        "path": path,
        "content_type": content_type,
        "file_size": file_size,
    }
    if expires_in_minutes is not None:
        request["expires_in_minutes"] = expires_in_minutes
    return request


def _resolve_body_size(body: AsyncUploadBody, file_size: int | None) -> int:
    if file_size is not None:
        normalized = int(file_size)
        if normalized < 0:
            raise ConjoinConfigurationError("file_size must be greater than or equal to 0")
        return normalized

    if isinstance(body, (bytes, bytearray, memoryview)):
        return len(body)

    if _is_path(body):
        return Path(body).stat().st_size

    size = _file_remaining_size(body)
    if size is not None:
        return size

    raise ConjoinConfigurationError("file_size is required for stream-like upload bodies")


def _file_remaining_size(body: object) -> int | None:
    tell = getattr(body, "tell", None)
    seek = getattr(body, "seek", None)
    if not callable(tell) or not callable(seek):
        return None

    try:
        current = int(cast(Any, tell)())
        cast(Any, seek)(0, os.SEEK_END)
        end = int(cast(Any, tell)())
        cast(Any, seek)(current, os.SEEK_SET)
    except (OSError, ValueError, TypeError):
        return None

    return max(0, end - current)


@contextmanager
def _sync_content(body: SyncUploadBody) -> Iterator[Any]:
    if isinstance(body, (bytes, bytearray, memoryview)):
        yield bytes(body)
        return

    if _is_path(body):
        with Path(body).open("rb") as file:
            yield file
        return

    if _is_readable(body):
        yield body
        return

    yield _coerce_sync_iterable(body)


@asynccontextmanager
async def _async_content(body: AsyncUploadBody) -> AsyncIterator[Any]:
    if isinstance(body, (bytes, bytearray, memoryview)):
        yield bytes(body)
        return

    if _is_path(body):
        with Path(body).open("rb") as file:
            yield _iter_sync_file_as_async(file)
        return

    if _is_readable(body):
        yield _iter_sync_file_as_async(body)
        return

    if isinstance(body, AsyncIterable):
        yield _coerce_async_iterable(body)
        return

    yield _iter_sync_iterable_as_async(body)


def _iter_sync_chunks(body: SyncUploadBody, chunk_size: int) -> Iterator[bytes]:
    if isinstance(body, (bytes, bytearray, memoryview)):
        data = bytes(body)
        for offset in range(0, len(data), chunk_size):
            yield data[offset : offset + chunk_size]
        return

    if _is_path(body):
        with Path(body).open("rb") as file:
            yield from _iter_file_chunks(file, chunk_size)
        return

    if _is_readable(body):
        yield from _iter_file_chunks(body, chunk_size)
        return

    yield from _coalesce_chunks(_coerce_sync_iterable(body), chunk_size)


async def _iter_async_chunks(body: AsyncUploadBody, chunk_size: int) -> AsyncIterator[bytes]:
    if isinstance(body, (bytes, bytearray, memoryview)):
        data = bytes(body)
        for offset in range(0, len(data), chunk_size):
            yield data[offset : offset + chunk_size]
        return

    if _is_path(body):
        with Path(body).open("rb") as file:
            async for chunk in _iter_sync_file_as_async(file, chunk_size=chunk_size):
                yield chunk
        return

    if _is_readable(body):
        async for chunk in _iter_sync_file_as_async(body, chunk_size=chunk_size):
            yield chunk
        return

    if isinstance(body, AsyncIterable):
        async for chunk in _coalesce_async_chunks(_coerce_async_iterable(body), chunk_size):
            yield chunk
        return

    async for chunk in _coalesce_async_chunks(_iter_sync_iterable_as_async(body), chunk_size):
        yield chunk


def _iter_file_chunks(file: Any, chunk_size: int) -> Iterator[bytes]:
    while True:
        chunk = file.read(chunk_size)
        if not chunk:
            return
        yield _coerce_bytes(chunk)


async def _iter_sync_file_as_async(
    file: Any,
    *,
    chunk_size: int = STREAM_READ_SIZE,
) -> AsyncIterator[bytes]:
    while True:
        chunk = file.read(chunk_size)
        if not chunk:
            return
        yield _coerce_bytes(chunk)


def _coerce_sync_iterable(body: Any) -> Iterator[bytes]:
    for chunk in body:
        coerced = _coerce_bytes(chunk)
        if coerced:
            yield coerced


async def _coerce_async_iterable(body: AsyncIterable[BytesLike]) -> AsyncIterator[bytes]:
    async for chunk in body:
        coerced = _coerce_bytes(chunk)
        if coerced:
            yield coerced


async def _iter_sync_iterable_as_async(body: Any) -> AsyncIterator[bytes]:
    for chunk in body:
        coerced = _coerce_bytes(chunk)
        if coerced:
            yield coerced


def _coalesce_chunks(chunks: Iterable[bytes], chunk_size: int) -> Iterator[bytes]:
    buffer = bytearray()
    for chunk in chunks:
        buffer.extend(chunk)
        while len(buffer) >= chunk_size:
            yield bytes(buffer[:chunk_size])
            del buffer[:chunk_size]
    if buffer:
        yield bytes(buffer)


async def _coalesce_async_chunks(
    chunks: AsyncIterable[bytes],
    chunk_size: int,
) -> AsyncIterator[bytes]:
    buffer = bytearray()
    async for chunk in chunks:
        buffer.extend(chunk)
        while len(buffer) >= chunk_size:
            yield bytes(buffer[:chunk_size])
            del buffer[:chunk_size]
    if buffer:
        yield bytes(buffer)


def _coerce_bytes(value: object) -> bytes:
    if isinstance(value, (bytes, bytearray, memoryview)):
        return bytes(value)
    raise ConjoinConfigurationError("upload body chunks must be bytes-like")


def _is_path(value: object) -> TypeGuard[PathInput]:
    return isinstance(value, (str, os.PathLike))


def _is_readable(value: object) -> bool:
    read = getattr(value, "read", None)
    return callable(read)


def _upload_required_fields(
    fields: Mapping[str, Any],
    upload_url: str,
) -> tuple[str, dict[str, str]]:
    method = fields.get("method")
    if not isinstance(method, str) or not method.strip():
        raise ConjoinStorageError(
            "Upload signed URL did not include a storage method",
            status_code=0,
            storage_url=upload_url,
        )
    normalized_method = method.strip().upper()
    if normalized_method not in {"POST", "PUT"}:
        raise ConjoinStorageError(
            f"Unsupported upload signed URL method: {normalized_method}",
            status_code=0,
            storage_url=upload_url,
        )

    headers = fields.get("headers")
    if not isinstance(headers, Mapping):
        raise ConjoinStorageError(
            "Upload signed URL did not include storage headers",
            status_code=0,
            storage_url=upload_url,
        )

    return normalized_method, {str(name): str(value) for name, value in headers.items()}


def _download_headers(headers: Mapping[str, str] | None) -> dict[str, str]:
    if headers is None:
        return {}
    return {str(name): str(value) for name, value in headers.items()}


def _validate_signed_url(url: str) -> str:
    stripped = url.strip()
    if not stripped.startswith(("http://", "https://")):
        raise ConjoinStorageError(
            "Storage signed URL must be absolute",
            status_code=0,
            storage_url=stripped,
        )
    return stripped


def _storage_timeout(
    client: Conjoin | AsyncConjoin,
    request_options: RequestOptions | Mapping[str, Any] | None,
) -> float:
    return _resolve_timeout(client.config, coerce_request_options(request_options))


def _send_sync_storage_request(
    client: Conjoin,
    method: str,
    url: str,
    *,
    headers: Mapping[str, str],
    content: Any = None,
    timeout: float,
    upload_mode: str | None,
) -> httpx.Response:
    try:
        request = client._client.build_request(
            method,
            url,
            headers=dict(headers),
            content=content,
            timeout=timeout,
        )
        _strip_unreturned_storage_headers(request.headers, returned_headers=headers)
        return client._client.send(request)
    except httpx.HTTPError as exc:
        raise _storage_transport_error(
            exc,
            timeout=timeout,
            url=url,
            upload_mode=upload_mode,
        ) from exc


async def _send_async_storage_request(
    client: AsyncConjoin,
    method: str,
    url: str,
    *,
    headers: Mapping[str, str],
    content: Any = None,
    timeout: float,
    upload_mode: str | None,
) -> httpx.Response:
    try:
        request = client._client.build_request(
            method,
            url,
            headers=dict(headers),
            content=content,
            timeout=timeout,
        )
        _strip_unreturned_storage_headers(request.headers, returned_headers=headers)
        return await client._client.send(request)
    except httpx.HTTPError as exc:
        raise _storage_transport_error(
            exc,
            timeout=timeout,
            url=url,
            upload_mode=upload_mode,
        ) from exc


def _send_sync_storage_stream_request(
    client: Conjoin,
    method: str,
    url: str,
    *,
    headers: Mapping[str, str],
    timeout: float,
) -> httpx.Response:
    request = client._client.build_request(
        method,
        url,
        headers=dict(headers),
        timeout=timeout,
    )
    _strip_unreturned_storage_headers(request.headers, returned_headers=headers)
    return client._client.send(request, stream=True)


async def _send_async_storage_stream_request(
    client: AsyncConjoin,
    method: str,
    url: str,
    *,
    headers: Mapping[str, str],
    timeout: float,
) -> httpx.Response:
    request = client._client.build_request(
        method,
        url,
        headers=dict(headers),
        timeout=timeout,
    )
    _strip_unreturned_storage_headers(request.headers, returned_headers=headers)
    return await client._client.send(request, stream=True)


def _strip_unreturned_storage_headers(
    headers: httpx.Headers,
    *,
    returned_headers: Mapping[str, str],
) -> None:
    returned = {name.lower() for name in returned_headers}
    for managed_header in STORAGE_MANAGED_HEADERS:
        if managed_header not in returned:
            headers.pop(managed_header, None)


def _storage_transport_error(
    exc: httpx.HTTPError,
    *,
    timeout: float,
    url: str,
    upload_mode: str | None,
) -> ConjoinError:
    return map_transport_error(exc, timeout=timeout)


def _initiate_sync_resumable_session(
    client: Conjoin,
    url: str,
    *,
    headers: Mapping[str, str],
    timeout: float,
) -> str:
    response = _send_sync_storage_request(
        client,
        "POST",
        url,
        headers=headers,
        timeout=timeout,
        upload_mode="resumable",
    )
    _raise_for_storage_error(
        response,
        url,
        upload_mode="resumable",
        action="Failed to initiate resumable upload",
    )
    return _resumable_session_url(response, url)


async def _initiate_async_resumable_session(
    client: AsyncConjoin,
    url: str,
    *,
    headers: Mapping[str, str],
    timeout: float,
) -> str:
    response = await _send_async_storage_request(
        client,
        "POST",
        url,
        headers=headers,
        timeout=timeout,
        upload_mode="resumable",
    )
    _raise_for_storage_error(
        response,
        url,
        upload_mode="resumable",
        action="Failed to initiate resumable upload",
    )
    return _resumable_session_url(response, url)


def _resumable_session_url(response: httpx.Response, url: str) -> str:
    session_url = response.headers.get("Location")
    if session_url is None or not session_url.strip():
        raise ConjoinStorageError(
            "Resumable upload initiation did not return a session URL",
            status_code=response.status_code,
            storage_url=url,
            upload_mode="resumable",
            body=preview_body(response.text),
        )
    return _validate_signed_url(session_url)


def _confirmed_resumable_offset(response: httpx.Response, *, expected: int, url: str) -> int:
    range_header = response.headers.get("Range")
    if range_header is None:
        return expected

    prefix = "bytes=0-"
    if not range_header.startswith(prefix):
        return expected

    try:
        confirmed = int(range_header[len(prefix) :]) + 1
    except ValueError:
        return expected

    if confirmed != expected:
        raise ConjoinStorageError(
            "Resumable upload confirmed an unexpected byte range",
            status_code=response.status_code,
            storage_url=url,
            upload_mode="resumable",
        )

    return confirmed


def _raise_for_storage_error(
    response: httpx.Response,
    url: str,
    *,
    upload_mode: str | None,
    action: str,
) -> None:
    if response.status_code < 400:
        return

    body = preview_body(response.text)
    message = f"{action} failed: {response.status_code} {response.reason_phrase}".strip()
    raise ConjoinStorageError(
        message,
        status_code=response.status_code,
        storage_url=url,
        upload_mode=upload_mode,
        body=body,
    )


def _emit_progress(
    on_progress: UploadProgressCallback | None,
    *,
    loaded: int,
    total: int,
) -> None:
    if on_progress is None:
        return
    percentage = 100 if total == 0 else round((loaded / total) * 100)
    on_progress(UploadProgress(loaded=loaded, total=total, percentage=percentage))
