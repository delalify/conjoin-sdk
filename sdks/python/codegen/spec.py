from __future__ import annotations

import json
from pathlib import Path
from typing import Any

SPEC_PATH = Path(__file__).resolve().parents[3] / "spec" / "openapi.json"


def load_openapi(path: Path = SPEC_PATH) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_ref(spec: dict[str, Any], value: dict[str, Any]) -> dict[str, Any]:
    ref = value.get("$ref")
    if not isinstance(ref, str):
        return value

    if not ref.startswith("#/"):
        raise ValueError(f"Unsupported OpenAPI reference: {ref}")

    current: Any = spec
    for part in ref[2:].split("/"):
        if not isinstance(current, dict):
            raise ValueError(f"Invalid OpenAPI reference: {ref}")
        current = current[part]

    if not isinstance(current, dict):
        raise ValueError(f"OpenAPI reference did not resolve to an object: {ref}")
    return current


def maybe_resolve_ref(spec: dict[str, Any], value: Any) -> Any:
    if isinstance(value, dict) and "$ref" in value:
        return resolve_ref(spec, value)
    return value
