from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator, Callable, Iterable, Iterator
from typing import Any

import httpx
import pytest

from conjoin_cloud import (
    AsyncConjoin,
    ChatCompletionChunk,
    Conjoin,
    ConjoinConfigurationError,
    ConjoinError,
    ConjoinStorageError,
    UploadProgress,
)
from conjoin_cloud._transport import CONJOIN_REQUEST_ID_HEADER

VALID_REQUEST_ID = "cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1"
CHUNK_SIZE = 256 * 1024


class TrackingSyncStream(httpx.SyncByteStream):
    def __init__(self, chunks: Iterable[bytes]) -> None:
        self._chunks = tuple(chunks)
        self.closed = False

    def __iter__(self) -> Iterator[bytes]:
        return iter(self._chunks)

    def close(self) -> None:
        self.closed = True


class TrackingAsyncStream(httpx.AsyncByteStream):
    def __init__(self, chunks: Iterable[bytes]) -> None:
        self._chunks = tuple(chunks)
        self.closed = False

    def __aiter__(self) -> AsyncIterator[bytes]:
        async def iterator() -> AsyncIterator[bytes]:
            for chunk in self._chunks:
                yield chunk

        return iterator()

    async def aclose(self) -> None:
        self.closed = True


def make_client(handler: Callable[[httpx.Request], httpx.Response]) -> Conjoin:
    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    return Conjoin(api_key="ck_test_123", http_client=http_client, max_retries=0)


def make_async_client(handler: Callable[[httpx.Request], httpx.Response]) -> AsyncConjoin:
    http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return AsyncConjoin(api_key="ck_test_123", http_client=http_client, max_retries=0)


def conjoin_response(request: httpx.Request, data: dict[str, Any]) -> httpx.Response:
    return httpx.Response(
        200,
        json={"data": data},
        headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
        request=request,
    )


def chat_completion_payload() -> dict[str, Any]:
    return {
        "id": "chatcmpl_123",
        "object": "chat.completion",
        "created": 1,
        "model": "conjoin-test",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": "Hello back"},
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3},
    }


def ai_inference_payload() -> dict[str, Any]:
    return {
        "request_id": "ai_req_123",
        "conjoin_account_id": "cnj_acct_123",
        "conjoin_project_id": "cnj_proj_123",
        "live_mode": False,
        "conjoin_request_id": VALID_REQUEST_ID,
        "model": "conjoin-test",
        "provider": "conjoin",
        "request_type": "chat_completion",
        "status": "completed",
        "token_usage": {"input_tokens": 1, "output_tokens": 2, "total_tokens": 3},
        "cost_usd": 0.01,
        "latency_ms": 10,
        "streaming_enabled": False,
        "policy_applied": False,
        "is_byok": False,
        "context_used": False,
        "date_created": "2026-01-01T00:00:00Z",
        "date_updated": "2026-01-01T00:00:00Z",
    }


def chat_chunk_payload(content: str = "Hello") -> dict[str, Any]:
    return {
        "id": "chatcmpl_chunk_123",
        "object": "chat.completion.chunk",
        "created": 1,
        "model": "conjoin-test",
        "choices": [
            {
                "index": 0,
                "delta": {"content": content},
                "finish_reason": None,
            }
        ],
    }


def test_ai_chat_helper_endpoint_matches_generated_chat_completion_endpoint() -> None:
    api_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        api_paths.append(request.url.path.removeprefix("/v1/"))
        if json.loads(request.content).get("stream") is True:
            return httpx.Response(
                200,
                stream=TrackingSyncStream([b"data: [DONE]\n\n"]),
                request=request,
            )
        if len(api_paths) == 1:
            return conjoin_response(request, ai_inference_payload())
        return conjoin_response(request, chat_completion_payload())

    client = make_client(handler)
    try:
        client.ai.inferences.create_chat_completion(
            data={"model": "conjoin-test", "messages": [{"role": "user", "content": "Hello"}]},
        )
        client.ai.chat.complete(
            model="conjoin-test",
            messages=[{"role": "user", "content": "Hello"}],
        )
        list(
            client.ai.chat.stream(
                model="conjoin-test",
                messages=[{"role": "user", "content": "Hello"}],
            )
        )
    finally:
        client.close()

    generated_path = api_paths[0]
    assert api_paths == [generated_path, generated_path, generated_path]


def test_storage_helper_signed_url_endpoints_match_generated_resources() -> None:
    api_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "api.conjoin.cloud":
            api_paths.append(request.url.path.removeprefix("/v1/"))
            if request.url.path.endswith("download/signed-url"):
                return conjoin_response(
                    request,
                    {"url": "https://storage.example.com/download", "headers": {}},
                )
            return conjoin_response(
                request,
                {
                    "upload_url": "https://storage.example.com/upload",
                    "required_fields": {"method": "PUT", "headers": {}},
                    "upload_mode": "single",
                },
            )

        return httpx.Response(200, text="downloaded", request=request)

    client = make_client(handler)
    try:
        client.storage.objects.create_upload_signed_url(
            data={
                "container_name_or_id": "bucket",
                "path": "file.txt",
                "content_type": "text/plain",
                "file_size": 4,
            }
        )
        client.storage.upload(
            container="bucket",
            path="file.txt",
            content_type="text/plain",
            body=b"data",
        )
        client.storage.objects.create_download_signed_url(
            data={"container_name_or_id": "bucket", "path": "file.txt"}
        )
        download = client.storage.download(container="bucket", path="file.txt")
        download.close()
    finally:
        client.close()

    generated_upload_path = api_paths[0]
    generated_download_path = api_paths[2]
    assert api_paths == [
        generated_upload_path,
        generated_upload_path,
        generated_download_path,
        generated_download_path,
    ]


def test_storage_single_upload_uses_signed_url_without_managed_auth_headers() -> None:
    seen_requests: list[httpx.Request] = []
    progress: list[UploadProgress] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_requests.append(request)
        if request.url.host == "api.conjoin.cloud":
            assert json.loads(request.content) == {
                "container_name_or_id": "bucket",
                "path": "photos/cat.jpg",
                "content_type": "image/jpeg",
                "file_size": 4,
            }
            return conjoin_response(
                request,
                {
                    "upload_url": "https://storage.example.com/upload",
                    "required_fields": {
                        "method": "PUT",
                        "headers": {"x-storage-header": "signed"},
                    },
                    "upload_mode": "single",
                },
            )

        assert request.method == "PUT"
        assert request.headers["x-storage-header"] == "signed"
        assert "Authorization" not in request.headers
        assert request.content == b"data"
        return httpx.Response(200, request=request)

    client = make_client(handler)
    try:
        client.storage.upload(
            container="bucket",
            path="photos/cat.jpg",
            content_type="image/jpeg",
            body=b"data",
            on_progress=progress.append,
        )
    finally:
        client.close()

    assert [request.url.host for request in seen_requests] == [
        "api.conjoin.cloud",
        "storage.example.com",
    ]
    assert progress == [
        UploadProgress(loaded=0, total=4, percentage=0),
        UploadProgress(loaded=4, total=4, percentage=100),
    ]


def test_storage_signed_url_requests_strip_default_client_managed_headers() -> None:
    seen_storage_headers: httpx.Headers | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_storage_headers
        if request.url.host == "api.conjoin.cloud":
            assert request.headers["Authorization"] == "Bearer ck_test_123"
            return conjoin_response(
                request,
                {
                    "upload_url": "https://storage.example.com/upload",
                    "required_fields": {"method": "PUT", "headers": {}},
                    "upload_mode": "single",
                },
            )

        seen_storage_headers = request.headers
        return httpx.Response(200, request=request)

    http_client = httpx.Client(
        transport=httpx.MockTransport(handler),
        headers={
            "Authorization": "Bearer leaked",
            "Content-Type": "application/json",
            "X-Conjoin-API-Version": "2020-01-01",
        },
    )
    client = Conjoin(api_key="ck_test_123", http_client=http_client, max_retries=0)
    try:
        client.storage.upload(
            container="bucket",
            path="file.txt",
            content_type="text/plain",
            body=b"data",
        )
    finally:
        client.close()

    assert seen_storage_headers is not None
    assert "Authorization" not in seen_storage_headers
    assert "Content-Type" not in seen_storage_headers
    assert "X-Conjoin-API-Version" not in seen_storage_headers


def test_storage_resumable_upload_sends_aligned_chunks_with_ranges() -> None:
    total_size = CHUNK_SIZE * 2
    body = b"a" * total_size
    seen_ranges: list[str] = []
    progress: list[UploadProgress] = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "api.conjoin.cloud":
            return conjoin_response(
                request,
                {
                    "upload_url": "https://storage.example.com/resumable",
                    "required_fields": {
                        "method": "POST",
                        "headers": {"x-goog-resumable": "start"},
                    },
                    "upload_mode": "resumable",
                },
            )

        if request.url.path == "/resumable":
            assert request.method == "POST"
            assert request.headers["x-goog-resumable"] == "start"
            return httpx.Response(
                200,
                headers={"Location": "https://storage.example.com/session"},
                request=request,
            )

        seen_ranges.append(request.headers["Content-Range"])
        if len(seen_ranges) == 1:
            assert request.headers["Content-Length"] == str(CHUNK_SIZE)
            return httpx.Response(
                308,
                headers={"Range": f"bytes=0-{CHUNK_SIZE - 1}"},
                request=request,
            )

        assert request.headers["Content-Length"] == str(CHUNK_SIZE)
        return httpx.Response(200, request=request)

    client = make_client(handler)
    try:
        client.storage.upload(
            container="bucket",
            path="large.bin",
            content_type="application/octet-stream",
            body=body,
            chunk_size=CHUNK_SIZE,
            on_progress=progress.append,
        )
    finally:
        client.close()

    assert seen_ranges == [
        f"bytes 0-{CHUNK_SIZE - 1}/{total_size}",
        f"bytes {CHUNK_SIZE}-{total_size - 1}/{total_size}",
    ]
    assert progress == [
        UploadProgress(loaded=0, total=total_size, percentage=0),
        UploadProgress(loaded=CHUNK_SIZE, total=total_size, percentage=50),
        UploadProgress(loaded=total_size, total=total_size, percentage=100),
    ]


def test_storage_upload_validates_chunk_size_and_unknown_stream_size() -> None:
    client = make_client(lambda request: pytest.fail(f"unexpected request to {request.url}"))
    try:
        with pytest.raises(ConjoinConfigurationError, match="chunk_size"):
            client.storage.upload(
                container="bucket",
                path="file.bin",
                content_type="application/octet-stream",
                body=b"abc",
                chunk_size=1000,
            )

        with pytest.raises(ConjoinConfigurationError, match="file_size"):
            client.storage.upload(
                container="bucket",
                path="file.bin",
                content_type="application/octet-stream",
                body=iter([b"abc"]),
            )
    finally:
        client.close()


def test_storage_upload_and_download_raise_typed_storage_errors() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if (
            request.url.host == "api.conjoin.cloud"
            and request.url.path.endswith("upload/signed-url")
        ):
            return conjoin_response(
                request,
                {
                    "upload_url": "https://storage.example.com/upload",
                    "required_fields": {"method": "PUT", "headers": {}},
                    "upload_mode": "single",
                },
            )
        if request.url.host == "api.conjoin.cloud":
            return conjoin_response(
                request,
                {"url": "https://storage.example.com/download", "headers": {"x-download": "1"}},
            )
        return httpx.Response(403, text="Forbidden", request=request)

    client = make_client(handler)
    try:
        with pytest.raises(ConjoinStorageError) as upload_exc:
            client.storage.upload(
                container="bucket",
                path="file.txt",
                content_type="text/plain",
                body=b"x",
            )
        assert upload_exc.value.status_code == 403
        assert upload_exc.value.storage_url == "https://storage.example.com/upload"
        assert upload_exc.value.upload_mode == "single"

        with pytest.raises(ConjoinStorageError) as download_exc:
            client.storage.download(container="bucket", path="file.txt")
        assert download_exc.value.status_code == 403
        assert download_exc.value.storage_url == "https://storage.example.com/download"
    finally:
        client.close()


def test_storage_download_returns_body_helpers_and_closes_response() -> None:
    seen_storage_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_storage_request
        if request.url.host == "api.conjoin.cloud":
            return conjoin_response(
                request,
                {
                    "url": "https://storage.example.com/file.txt",
                    "headers": {"x-storage-header": "download"},
                },
            )

        seen_storage_request = request
        return httpx.Response(
            200,
            stream=TrackingSyncStream([b"hello ", b"world"]),
            request=request,
        )

    client = make_client(handler)
    try:
        download = client.storage.download(container="bucket", path="file.txt")
        assert download.url == "https://storage.example.com/file.txt"
        assert download.text() == "hello world"
        assert download.response.is_closed
    finally:
        client.close()

    assert seen_storage_request is not None
    assert seen_storage_request.headers["x-storage-header"] == "download"
    assert "Authorization" not in seen_storage_request.headers


def test_async_storage_single_upload_matches_sync_behavior() -> None:
    seen_storage_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_storage_request
        if request.url.host == "api.conjoin.cloud":
            return conjoin_response(
                request,
                {
                    "upload_url": "https://storage.example.com/upload",
                    "required_fields": {
                        "method": "PUT",
                        "headers": {"x-storage-header": "signed"},
                    },
                    "upload_mode": "single",
                },
            )

        seen_storage_request = request
        return httpx.Response(200, request=request)

    async def run() -> None:
        client = make_async_client(handler)
        try:
            await client.storage.upload(
                container="bucket",
                path="file.txt",
                content_type="text/plain",
                body=b"async",
            )
        finally:
            await client.aclose()

    asyncio.run(run())

    assert seen_storage_request is not None
    assert seen_storage_request.method == "PUT"
    assert seen_storage_request.content == b"async"
    assert "Authorization" not in seen_storage_request.headers


def test_ai_chat_complete_sends_stream_false_and_returns_typed_response() -> None:
    seen_body: dict[str, Any] | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_body
        seen_body = json.loads(request.content)
        return conjoin_response(request, chat_completion_payload())

    client = make_client(handler)
    try:
        response = client.ai.chat.complete(
            model="conjoin-test",
            messages=[{"role": "user", "content": "Hello"}],
        )
    finally:
        client.close()

    assert seen_body == {
        "model": "conjoin-test",
        "messages": [{"role": "user", "content": "Hello"}],
        "stream": False,
    }
    assert response.id == "chatcmpl_123"
    assert response.choices[0].message.content == "Hello back"
    assert response._request_id == VALID_REQUEST_ID


def test_ai_chat_stream_parses_split_sse_chunks_and_closes_on_done() -> None:
    payload = json.dumps(chat_chunk_payload())
    stream = TrackingSyncStream(
        [
            b"event: chunk\r\n",
            f"data: {payload[:10]}".encode(),
            f"{payload[10:]}\r\n\r\n".encode(),
            b": keepalive\n\n",
            b"data: [DONE]\n\n",
        ]
    )

    def handler(request: httpx.Request) -> httpx.Response:
        assert json.loads(request.content)["stream"] is True
        return httpx.Response(
            200,
            stream=stream,
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    client = make_client(handler)
    try:
        chunks = list(
            client.ai.chat.stream(
                model="conjoin-test",
                messages=[{"role": "user", "content": "Hello"}],
            )
        )
    finally:
        client.close()

    assert len(chunks) == 1
    assert isinstance(chunks[0], ChatCompletionChunk)
    assert chunks[0].choices[0].delta.content == "Hello"
    assert chunks[0]._request_id == VALID_REQUEST_ID
    assert stream.closed


def test_ai_chat_stream_errors_include_codes_and_request_ids() -> None:
    def api_error_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            400,
            json={"message": "Invalid model"},
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    client = make_client(api_error_handler)
    try:
        with pytest.raises(ConjoinError) as exc_info:
            list(
                client.ai.chat.stream(
                    model="missing-model",
                    messages=[{"role": "user", "content": "Hello"}],
                )
            )
        assert exc_info.value.request_id == VALID_REQUEST_ID
        assert exc_info.value.status_code == 400
    finally:
        client.close()

    stream_error = TrackingSyncStream([b'data: {"error":{"message":"quota exceeded"}}\n\n'])
    malformed = TrackingSyncStream([b"data: not-json\n\n"])

    def stream_error_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            stream=stream_error,
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    client = make_client(stream_error_handler)
    try:
        with pytest.raises(ConjoinError) as exc_info:
            list(
                client.ai.chat.stream(
                    model="conjoin-test",
                    messages=[{"role": "user", "content": "Hello"}],
                )
            )
        assert exc_info.value.code == "stream_error"
        assert exc_info.value.request_id == VALID_REQUEST_ID
    finally:
        client.close()

    def parse_error_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            stream=malformed,
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    client = make_client(parse_error_handler)
    try:
        with pytest.raises(ConjoinError) as exc_info:
            list(
                client.ai.chat.stream(
                    model="conjoin-test",
                    messages=[{"role": "user", "content": "Hello"}],
                )
            )
        assert exc_info.value.code == "parse_error"
        assert exc_info.value.request_id == VALID_REQUEST_ID
    finally:
        client.close()


def test_ai_chat_stream_closes_response_when_iteration_stops_early() -> None:
    payload = json.dumps(chat_chunk_payload())
    stream = TrackingSyncStream([f"data: {payload}\n\n".encode(), f"data: {payload}\n\n".encode()])

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, stream=stream, request=request)

    client = make_client(handler)
    try:
        iterator = client.ai.chat.stream(
            model="conjoin-test",
            messages=[{"role": "user", "content": "Hello"}],
        )
        first = next(iterator)
        iterator.close()
    finally:
        client.close()

    assert first.choices[0].delta.content == "Hello"
    assert stream.closed


def test_async_ai_chat_stream_parses_chunks_and_closes_response() -> None:
    payload = json.dumps(chat_chunk_payload("async"))
    stream = TrackingAsyncStream([f"data: {payload}\n\n".encode(), b"data: [DONE]\n\n"])

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            stream=stream,
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    async def run() -> list[ChatCompletionChunk]:
        client = make_async_client(handler)
        try:
            chunks: list[ChatCompletionChunk] = []
            async for chunk in client.ai.chat.stream(
                model="conjoin-test",
                messages=[{"role": "user", "content": "Hello"}],
            ):
                chunks.append(chunk)
            return chunks
        finally:
            await client.aclose()

    chunks = asyncio.run(run())

    assert chunks[0].choices[0].delta.content == "async"
    assert chunks[0]._request_id == VALID_REQUEST_ID
    assert stream.closed
