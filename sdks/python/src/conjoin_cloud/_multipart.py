from __future__ import annotations

import json
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

MultipartPart = tuple[str, tuple[None, str | bytes]]


@dataclass(frozen=True)
class MultipartBody:
    fields: Mapping[str, Any]

    def to_httpx_files(self) -> list[MultipartPart]:
        parts: list[MultipartPart] = []
        for name, value in self.fields.items():
            _append_multipart_value(parts, name, value)
        return parts


def _append_multipart_value(parts: list[MultipartPart], name: str, value: Any) -> None:
    if value is None:
        return

    if isinstance(value, list | tuple):
        for item in value:
            _append_multipart_value(parts, name, item)
        return

    parts.append((name, (None, _serialize_multipart_value(value))))


def _serialize_multipart_value(value: Any) -> str | bytes:
    if isinstance(value, bytes):
        return value

    if isinstance(value, bool):
        return "true" if value else "false"

    if isinstance(value, str):
        return value

    if isinstance(value, int | float):
        return str(value)

    if isinstance(value, Mapping):
        return json.dumps(value, separators=(",", ":"), sort_keys=True)

    return str(value)
