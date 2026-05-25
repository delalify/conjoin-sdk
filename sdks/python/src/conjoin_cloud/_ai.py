from __future__ import annotations

import codecs
import json
import re
from collections.abc import AsyncIterable, AsyncIterator, Generator, Iterator, Mapping, Sequence
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

import httpx
from pydantic import ValidationError

from conjoin_cloud._errors import ConjoinConfigurationError, ConjoinError
from conjoin_cloud._models import ConjoinModel
from conjoin_cloud._request_options import RequestOptions, coerce_request_options
from conjoin_cloud._transport import (
    _resolve_timeout,
    attach_request_id,
    build_headers,
    build_url,
    get_response_request_id,
    map_transport_error,
    raise_for_error_response,
)
from conjoin_cloud.generated.ai import (
    AiResource as GeneratedAiResource,
)
from conjoin_cloud.generated.ai import (
    AsyncAiResource as GeneratedAsyncAiResource,
)

if TYPE_CHECKING:
    from conjoin_cloud import AsyncConjoin, Conjoin

CHAT_COMPLETIONS_PATH = "ai/inference/chat/completions"
_EVENT_SEPARATOR = re.compile(r"\r\n\r\n|\n\n|\r\r")


class ChatMessage(ConjoinModel):
    role: str
    content: str | None = None
    name: str | None = None
    tool_calls: Sequence[dict[str, Any]] | None = None
    tool_call_id: str | None = None


class ChatCompletionChoice(ConjoinModel):
    index: int
    message: ChatMessage
    finish_reason: str | None = None


class ChatCompletionUsage(ConjoinModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(ConjoinModel):
    id: str
    object: str
    created: int
    model: str
    choices: Sequence[ChatCompletionChoice]
    usage: ChatCompletionUsage | None = None


class ChatCompletionChunkDelta(ConjoinModel):
    role: str | None = None
    content: str | None = None
    tool_calls: Sequence[dict[str, Any]] | None = None


class ChatCompletionChunkChoice(ConjoinModel):
    index: int
    delta: ChatCompletionChunkDelta
    finish_reason: str | None = None


class ChatCompletionChunk(ConjoinModel):
    id: str
    object: str
    created: int
    model: str
    choices: Sequence[ChatCompletionChunkChoice]
    usage: ChatCompletionUsage | None = None


@dataclass(frozen=True)
class ServerSentEvent:
    event: str | None
    data: str


class AiResource(GeneratedAiResource):
    chat: AiChatResource

    def __init__(self, client: Conjoin, *, profile_id: str | None = None) -> None:
        super().__init__(client, profile_id=profile_id)
        self.chat = AiChatResource(client)


class AsyncAiResource(GeneratedAsyncAiResource):
    chat: AsyncAiChatResource

    def __init__(self, client: AsyncConjoin, *, profile_id: str | None = None) -> None:
        super().__init__(client, profile_id=profile_id)
        self.chat = AsyncAiChatResource(client)


class AiChatResource:
    def __init__(self, client: Conjoin) -> None:
        self._client = client

    def complete(
        self,
        *,
        model: str,
        messages: Sequence[Mapping[str, Any]],
        temperature: float | None = None,
        top_p: float | None = None,
        max_tokens: int | None = None,
        stop: str | Sequence[str] | None = None,
        tools: Sequence[Mapping[str, Any]] | None = None,
        tool_choice: str | Mapping[str, Any] | None = None,
        response_format: Mapping[str, Any] | None = None,
        user: str | None = None,
        context: Mapping[str, Any] | None = None,
        metadata: Mapping[str, Any] | None = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> ChatCompletionResponse:
        body = _chat_body(
            model=model,
            messages=messages,
            stream=False,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            stop=stop,
            tools=tools,
            tool_choice=tool_choice,
            response_format=response_format,
            user=user,
            context=context,
            metadata=metadata,
        )
        return self._client.request(
            "POST",
            CHAT_COMPLETIONS_PATH,
            body=body,
            cast_to=ChatCompletionResponse,
            request_options=request_options,
        )

    def stream(
        self,
        *,
        model: str,
        messages: Sequence[Mapping[str, Any]],
        temperature: float | None = None,
        top_p: float | None = None,
        max_tokens: int | None = None,
        stop: str | Sequence[str] | None = None,
        tools: Sequence[Mapping[str, Any]] | None = None,
        tool_choice: str | Mapping[str, Any] | None = None,
        response_format: Mapping[str, Any] | None = None,
        user: str | None = None,
        context: Mapping[str, Any] | None = None,
        metadata: Mapping[str, Any] | None = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> Generator[ChatCompletionChunk, None, None]:
        body = _chat_body(
            model=model,
            messages=messages,
            stream=True,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            stop=stop,
            tools=tools,
            tool_choice=tool_choice,
            response_format=response_format,
            user=user,
            context=context,
            metadata=metadata,
        )
        yield from _iter_sync_chat_stream(self._client, body, request_options=request_options)


class AsyncAiChatResource:
    def __init__(self, client: AsyncConjoin) -> None:
        self._client = client

    async def complete(
        self,
        *,
        model: str,
        messages: Sequence[Mapping[str, Any]],
        temperature: float | None = None,
        top_p: float | None = None,
        max_tokens: int | None = None,
        stop: str | Sequence[str] | None = None,
        tools: Sequence[Mapping[str, Any]] | None = None,
        tool_choice: str | Mapping[str, Any] | None = None,
        response_format: Mapping[str, Any] | None = None,
        user: str | None = None,
        context: Mapping[str, Any] | None = None,
        metadata: Mapping[str, Any] | None = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> ChatCompletionResponse:
        body = _chat_body(
            model=model,
            messages=messages,
            stream=False,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            stop=stop,
            tools=tools,
            tool_choice=tool_choice,
            response_format=response_format,
            user=user,
            context=context,
            metadata=metadata,
        )
        return await self._client.request(
            "POST",
            CHAT_COMPLETIONS_PATH,
            body=body,
            cast_to=ChatCompletionResponse,
            request_options=request_options,
        )

    async def stream(
        self,
        *,
        model: str,
        messages: Sequence[Mapping[str, Any]],
        temperature: float | None = None,
        top_p: float | None = None,
        max_tokens: int | None = None,
        stop: str | Sequence[str] | None = None,
        tools: Sequence[Mapping[str, Any]] | None = None,
        tool_choice: str | Mapping[str, Any] | None = None,
        response_format: Mapping[str, Any] | None = None,
        user: str | None = None,
        context: Mapping[str, Any] | None = None,
        metadata: Mapping[str, Any] | None = None,
        request_options: RequestOptions | Mapping[str, Any] | None = None,
    ) -> AsyncIterator[ChatCompletionChunk]:
        body = _chat_body(
            model=model,
            messages=messages,
            stream=True,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            stop=stop,
            tools=tools,
            tool_choice=tool_choice,
            response_format=response_format,
            user=user,
            context=context,
            metadata=metadata,
        )
        async for chunk in _iter_async_chat_stream(
            self._client,
            body,
            request_options=request_options,
        ):
            yield chunk


def _chat_body(
    *,
    model: str,
    messages: Sequence[Mapping[str, Any]],
    stream: bool,
    temperature: float | None,
    top_p: float | None,
    max_tokens: int | None,
    stop: str | Sequence[str] | None,
    tools: Sequence[Mapping[str, Any]] | None,
    tool_choice: str | Mapping[str, Any] | None,
    response_format: Mapping[str, Any] | None,
    user: str | None,
    context: Mapping[str, Any] | None,
    metadata: Mapping[str, Any] | None,
) -> dict[str, Any]:
    if not model.strip():
        raise ConjoinConfigurationError("model must not be empty")
    if not messages:
        raise ConjoinConfigurationError("messages must not be empty")

    body: dict[str, Any] = {
        "model": model,
        "messages": [dict(message) for message in messages],
        "stream": stream,
        "temperature": temperature,
        "top_p": top_p,
        "max_tokens": max_tokens,
        "stop": stop,
        "tools": [dict(tool) for tool in tools] if tools is not None else None,
        "tool_choice": tool_choice,
        "response_format": dict(response_format) if response_format is not None else None,
        "user": user,
        "context": dict(context) if context is not None else None,
        "metadata": dict(metadata) if metadata is not None else None,
    }
    return {key: value for key, value in body.items() if value is not None}


def _iter_sync_chat_stream(
    client: Conjoin,
    body: Mapping[str, Any],
    *,
    request_options: RequestOptions | Mapping[str, Any] | None,
) -> Generator[ChatCompletionChunk, None, None]:
    options = coerce_request_options(request_options)
    timeout = _resolve_timeout(client.config, options)
    url = build_url(client.config, CHAT_COMPLETIONS_PATH, None)
    headers = build_headers(client.config, options)
    try:
        with client._client.stream(
            "POST",
            url,
            headers=headers,
            json=dict(body),
            timeout=timeout,
        ) as response:
            if response.status_code >= 400:
                response.read()
                raise_for_error_response(response)
            request_id = get_response_request_id(response)
            for event in _iter_sse_events(response.iter_bytes()):
                if event.data == "[DONE]":
                    return
                yield _parse_chat_chunk(
                    event.data,
                    status_code=response.status_code,
                    request_id=request_id,
                )
    except httpx.HTTPError as exc:
        raise map_transport_error(exc, timeout=timeout) from exc


async def _iter_async_chat_stream(
    client: AsyncConjoin,
    body: Mapping[str, Any],
    *,
    request_options: RequestOptions | Mapping[str, Any] | None,
) -> AsyncIterator[ChatCompletionChunk]:
    options = coerce_request_options(request_options)
    timeout = _resolve_timeout(client.config, options)
    url = build_url(client.config, CHAT_COMPLETIONS_PATH, None)
    headers = build_headers(client.config, options)
    try:
        async with client._client.stream(
            "POST",
            url,
            headers=headers,
            json=dict(body),
            timeout=timeout,
        ) as response:
            if response.status_code >= 400:
                await response.aread()
                raise_for_error_response(response)
            request_id = get_response_request_id(response)
            async for event in _aiter_sse_events(response.aiter_bytes()):
                if event.data == "[DONE]":
                    return
                yield _parse_chat_chunk(
                    event.data,
                    status_code=response.status_code,
                    request_id=request_id,
                )
    except httpx.HTTPError as exc:
        raise map_transport_error(exc, timeout=timeout) from exc


def _parse_chat_chunk(
    event_data: str,
    *,
    status_code: int,
    request_id: str | None,
) -> ChatCompletionChunk:
    try:
        payload = json.loads(event_data)
    except ValueError as exc:
        raise ConjoinError(
            f"Failed to parse SSE chunk: {event_data}",
            status_code=status_code,
            code="parse_error",
            request_id=request_id,
        ) from exc

    if isinstance(payload, Mapping):
        error = payload.get("error")
        if isinstance(error, Mapping):
            message = error.get("message")
            raise ConjoinError(
                message if isinstance(message, str) and message.strip() else "AI stream error",
                status_code=status_code,
                code="stream_error",
                request_id=request_id,
            )

    try:
        chunk = ChatCompletionChunk.model_validate(payload)
    except ValidationError as exc:
        raise ConjoinError(
            f"Failed to parse SSE chunk: {event_data}",
            status_code=status_code,
            code="parse_error",
            request_id=request_id,
        ) from exc

    attach_request_id(chunk, request_id)
    return chunk


def _iter_sse_events(chunks: Iterator[bytes]) -> Iterator[ServerSentEvent]:
    decoder = codecs.getincrementaldecoder("utf-8")()
    buffer = ""
    for chunk in chunks:
        buffer += decoder.decode(chunk, final=False)
        events, buffer = _split_sse_buffer(buffer)
        yield from events

    buffer += decoder.decode(b"", final=True)
    event = _parse_sse_chunk(buffer)
    if event is not None:
        yield event


async def _aiter_sse_events(chunks: AsyncIterable[bytes]) -> AsyncIterator[ServerSentEvent]:
    decoder = codecs.getincrementaldecoder("utf-8")()
    buffer = ""
    async for chunk in chunks:
        buffer += decoder.decode(chunk, final=False)
        events, buffer = _split_sse_buffer(buffer)
        for event in events:
            yield event

    buffer += decoder.decode(b"", final=True)
    event = _parse_sse_chunk(buffer)
    if event is not None:
        yield event


def _split_sse_buffer(buffer: str) -> tuple[list[ServerSentEvent], str]:
    events: list[ServerSentEvent] = []
    while True:
        match = _EVENT_SEPARATOR.search(buffer)
        if match is None:
            return events, buffer
        raw_event = buffer[: match.start()]
        buffer = buffer[match.end() :]
        event = _parse_sse_chunk(raw_event)
        if event is not None:
            events.append(event)


def _parse_sse_chunk(chunk: str) -> ServerSentEvent | None:
    event_type: str | None = None
    data_lines: list[str] = []

    for line in chunk.splitlines():
        if line.startswith(":") or not line:
            continue

        field, separator, value = line.partition(":")
        if not separator:
            continue

        if value.startswith(" "):
            value = value[1:]

        if field == "event":
            event_type = value
        elif field == "data":
            data_lines.append(value)

    if not data_lines:
        return None

    return ServerSentEvent(event=event_type, data="\n".join(data_lines))
