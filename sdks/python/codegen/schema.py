from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from codegen.naming import to_snake


@dataclass(frozen=True)
class FieldDef:
    wire_name: str
    python_name: str
    annotation: str
    required: bool


@dataclass(frozen=True)
class ModelDef:
    name: str
    fields: tuple[FieldDef, ...]


@dataclass(frozen=True)
class TypedDictDef:
    name: str
    fields: tuple[FieldDef, ...]


def is_object_schema(schema: dict[str, Any] | None) -> bool:
    if not isinstance(schema, dict):
        return False
    properties = schema.get("properties")
    return isinstance(properties, dict) and bool(properties)


def model_from_schema(name: str, schema: dict[str, Any]) -> ModelDef:
    return ModelDef(name=name, fields=fields_from_schema(schema, required_by_default=False))


def typed_dict_from_schema(name: str, schema: dict[str, Any]) -> TypedDictDef:
    return TypedDictDef(name=name, fields=fields_from_schema(schema, required_by_default=False))


def fields_from_schema(
    schema: dict[str, Any],
    *,
    required_by_default: bool,
) -> tuple[FieldDef, ...]:
    properties = schema.get("properties")
    if not isinstance(properties, dict):
        return ()
    required_values = schema.get("required", [])
    required = {value for value in required_values if isinstance(value, str)}
    fields: list[FieldDef] = []
    for wire_name, property_schema in sorted(properties.items()):
        if not isinstance(wire_name, str) or not isinstance(property_schema, dict):
            continue
        fields.append(
            FieldDef(
                wire_name=wire_name,
                python_name=to_snake(wire_name),
                annotation=schema_annotation(property_schema),
                required=wire_name in required if not required_by_default else True,
            )
        )
    return tuple(fields)


def schema_annotation(schema: dict[str, Any]) -> str:
    alternatives = schema.get("oneOf") or schema.get("anyOf")
    if isinstance(alternatives, list):
        non_null = [
            schema_annotation(item)
            for item in alternatives
            if isinstance(item, dict) and item.get("type") != "null"
        ]
        unique = sorted(set(non_null))
        if len(unique) == 1:
            base = unique[0]
        elif not unique:
            base = "Any"
        else:
            base = "Any"
        if any(isinstance(item, dict) and item.get("type") == "null" for item in alternatives):
            return union_with_none(base)
        return base

    schema_type = schema.get("type")
    if isinstance(schema_type, list):
        non_null_types = [value for value in schema_type if value != "null"]
        base = schema_annotation({"type": non_null_types[0]}) if len(non_null_types) == 1 else "Any"
        return union_with_none(base) if "null" in schema_type else base
    if schema_type == "string":
        return "str"
    if schema_type == "integer":
        return "int"
    if schema_type == "number":
        return "float"
    if schema_type == "boolean":
        return "bool"
    if schema_type == "array":
        items = schema.get("items")
        item_type = schema_annotation(items) if isinstance(items, dict) else "Any"
        return f"Sequence[{item_type}]"
    if schema_type == "object":
        additional = schema.get("additionalProperties")
        if isinstance(additional, dict):
            return f"dict[str, {schema_annotation(additional)}]"
        return "dict[str, Any]"
    return "Any"


def union_with_none(annotation: str) -> str:
    return annotation if " | None" in annotation else f"{annotation} | None"
