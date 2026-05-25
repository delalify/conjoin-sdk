from __future__ import annotations

from collections.abc import Sequence
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field, PrivateAttr

T = TypeVar("T")


class ConjoinModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    _request_id: str | None = PrivateAttr(default=None)

    def _set_request_id(self, request_id: str | None) -> None:
        self._request_id = request_id


class Cursor(ConjoinModel):
    prev: str | None = None
    next: str | None = None


class Page(ConjoinModel, Generic[T]):
    success: bool = True
    data: Sequence[T] = Field(default_factory=tuple)
    status: int | None = None
    message: str | None = None
    cursor: Cursor | None = None
