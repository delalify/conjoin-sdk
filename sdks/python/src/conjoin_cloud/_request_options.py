from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any, Literal, TypedDict, cast

AuthType = Literal["default", "none", "bearer"]


@dataclass(frozen=True)
class AuthOverride:
    type: AuthType = "default"
    token: str | None = None


class AuthOverrideDict(TypedDict, total=False):
    type: AuthType
    token: str


@dataclass(frozen=True)
class RequestOptions:
    timeout: float | None = None
    max_retries: int | None = None
    conjoin_request_id: str | None = None
    headers: Mapping[str, str] | None = None
    auth: AuthOverride | AuthOverrideDict | None = None


def coerce_request_options(options: RequestOptions | Mapping[str, Any] | None) -> RequestOptions:
    if options is None:
        return RequestOptions()

    if isinstance(options, RequestOptions):
        return options

    return RequestOptions(
        timeout=cast(float | None, options.get("timeout")),
        max_retries=cast(int | None, options.get("max_retries")),
        conjoin_request_id=cast(str | None, options.get("conjoin_request_id")),
        headers=cast(Mapping[str, str] | None, options.get("headers")),
        auth=cast(AuthOverride | AuthOverrideDict | None, options.get("auth")),
    )


def resolve_auth_override(auth: AuthOverride | AuthOverrideDict | None) -> AuthOverride:
    if auth is None:
        return AuthOverride()

    if isinstance(auth, AuthOverride):
        return auth

    auth_type = auth.get("type", "default")
    token = auth.get("token")
    return AuthOverride(type=auth_type, token=token)
