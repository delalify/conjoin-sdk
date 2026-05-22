from __future__ import annotations

import re
import secrets
import threading
import time
from collections.abc import Mapping
from typing import TypeGuard

CONJOIN_REQUEST_ID_HEADER = "Conjoin-Request-Id"

_CONJOIN_REQUEST_ID_PREFIX = "cnj_req_"
_CONJOIN_REQUEST_ID_PATTERN = re.compile(
    r"^cnj_req_[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
_UUID_V7_STATE_LOCK = threading.Lock()
_uuid_v7_msecs = -1
_uuid_v7_seq = 0


def generate_conjoin_request_id() -> str:
    return f"{_CONJOIN_REQUEST_ID_PREFIX}{_generate_uuid_v7()}"


def is_valid_conjoin_request_id(value: object) -> TypeGuard[str]:
    return isinstance(value, str) and _CONJOIN_REQUEST_ID_PATTERN.fullmatch(value) is not None


def resolve_conjoin_request_id(value: str | None = None) -> str:
    if is_valid_conjoin_request_id(value):
        return value

    return generate_conjoin_request_id()


def get_conjoin_request_id_from_headers(headers: Mapping[str, object] | None) -> str | None:
    if headers is None:
        return None

    for name, value in headers.items():
        if name.lower() != CONJOIN_REQUEST_ID_HEADER.lower():
            continue

        header_value = _first_header_value(value)
        return header_value if is_valid_conjoin_request_id(header_value) else None

    return None


def _first_header_value(value: object) -> object:
    if isinstance(value, (list, tuple)):
        if not value:
            return None
        return value[0]

    return value


def _generate_uuid_v7() -> str:
    random_bytes = secrets.token_bytes(16)
    msecs, seq = _next_uuid_v7_state(time.time_ns() // 1_000_000, random_bytes)
    uuid_bytes = bytearray(16)

    uuid_bytes[0] = (msecs >> 40) & 0xFF
    uuid_bytes[1] = (msecs >> 32) & 0xFF
    uuid_bytes[2] = (msecs >> 24) & 0xFF
    uuid_bytes[3] = (msecs >> 16) & 0xFF
    uuid_bytes[4] = (msecs >> 8) & 0xFF
    uuid_bytes[5] = msecs & 0xFF
    uuid_bytes[6] = 0x70 | ((seq >> 28) & 0x0F)
    uuid_bytes[7] = (seq >> 20) & 0xFF
    uuid_bytes[8] = 0x80 | ((seq >> 14) & 0x3F)
    uuid_bytes[9] = (seq >> 6) & 0xFF
    uuid_bytes[10] = ((seq << 2) & 0xFF) | (random_bytes[10] & 0x03)
    uuid_bytes[11] = random_bytes[11]
    uuid_bytes[12] = random_bytes[12]
    uuid_bytes[13] = random_bytes[13]
    uuid_bytes[14] = random_bytes[14]
    uuid_bytes[15] = random_bytes[15]

    uuid_hex = uuid_bytes.hex()
    return (
        f"{uuid_hex[0:8]}-{uuid_hex[8:12]}-{uuid_hex[12:16]}-"
        f"{uuid_hex[16:20]}-{uuid_hex[20:32]}"
    )


def _next_uuid_v7_state(now_msecs: int, random_bytes: bytes) -> tuple[int, int]:
    global _uuid_v7_msecs, _uuid_v7_seq

    with _UUID_V7_STATE_LOCK:
        if now_msecs > _uuid_v7_msecs:
            _uuid_v7_msecs = now_msecs
            _uuid_v7_seq = (
                (random_bytes[6] << 23)
                | (random_bytes[7] << 16)
                | (random_bytes[8] << 8)
                | random_bytes[9]
            )
        else:
            _uuid_v7_seq = (_uuid_v7_seq + 1) & 0xFFFFFFFF
            if _uuid_v7_seq == 0:
                _uuid_v7_msecs += 1

        return _uuid_v7_msecs, _uuid_v7_seq
