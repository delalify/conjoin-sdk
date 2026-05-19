from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal

from codegen.naming import (
    operation_id_to_method_name,
    parse_tag,
    to_kebab,
    to_pascal,
    to_snake,
)
from codegen.spec import maybe_resolve_ref

HTTP_METHODS = frozenset({"delete", "get", "patch", "post", "put"})
AuthMode = Literal["default", "none", "scim_bearer"]


@dataclass(frozen=True)
class Parameter:
    name: str
    python_name: str
    location: str
    required: bool
    schema: dict[str, Any]


@dataclass(frozen=True)
class Operation:
    operation_id: str
    method_name: str
    http_method: str
    path: str
    tag: str
    auth_mode: AuthMode
    request_content_type: str
    response_content_type: str
    success_code: str
    has_request_body: bool
    has_data_property: bool
    is_list_response: bool
    path_parameters: tuple[Parameter, ...]
    query_parameters: tuple[Parameter, ...]
    header_parameters: tuple[Parameter, ...]
    request_schema: dict[str, Any] | None
    response_schema: dict[str, Any]
    response_data_schema: dict[str, Any]
    requires_messaging_profile: bool


@dataclass(frozen=True)
class ResourceGroup:
    service: str
    resource: str
    service_pascal: str
    resource_pascal: str
    operations: tuple[Operation, ...]


def collect_operations(spec: dict[str, Any]) -> tuple[Operation, ...]:
    operations: list[Operation] = []
    paths = spec.get("paths")
    if not isinstance(paths, dict):
        raise ValueError("OpenAPI spec is missing paths")

    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, raw_operation in methods.items():
            if method not in HTTP_METHODS or not isinstance(raw_operation, dict):
                continue
            operation_id = raw_operation.get("operationId")
            tags = raw_operation.get("tags")
            if not isinstance(operation_id, str) or not isinstance(tags, list) or not tags:
                continue
            service, resource = parse_tag(str(tags[0]))
            if not resource:
                continue
            operations.append(
                _build_operation(
                    spec,
                    path=str(path),
                    http_method=method.upper(),
                    raw_operation=raw_operation,
                    tag=str(tags[0]),
                    service_pascal=to_pascal(service),
                    resource_pascal=to_pascal(resource),
                )
            )
    return tuple(operations)


def collect_resource_groups(spec: dict[str, Any]) -> tuple[ResourceGroup, ...]:
    group_map: dict[str, ResourceGroup] = {}
    operation_map: dict[str, list[Operation]] = {}

    paths = spec.get("paths")
    if not isinstance(paths, dict):
        raise ValueError("OpenAPI spec is missing paths")

    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        for method, raw_operation in methods.items():
            if method not in HTTP_METHODS or not isinstance(raw_operation, dict):
                continue
            operation_id = raw_operation.get("operationId")
            tags = raw_operation.get("tags")
            if not isinstance(operation_id, str) or not isinstance(tags, list) or not tags:
                continue
            tag = str(tags[0])
            service, resource = parse_tag(tag)
            if not resource:
                continue
            service_pascal = to_pascal(service)
            resource_pascal = to_pascal(resource)
            group_key = f"{service}-{to_kebab(resource)}"
            if group_key not in group_map:
                group_map[group_key] = ResourceGroup(
                    service=service,
                    resource=resource,
                    service_pascal=service_pascal,
                    resource_pascal=resource_pascal,
                    operations=(),
                )
                operation_map[group_key] = []
            operation_map[group_key].append(
                _build_operation(
                    spec,
                    path=str(path),
                    http_method=method.upper(),
                    raw_operation=raw_operation,
                    tag=tag,
                    service_pascal=service_pascal,
                    resource_pascal=resource_pascal,
                )
            )

    groups: list[ResourceGroup] = []
    for key, group in group_map.items():
        groups.append(
            ResourceGroup(
                service=group.service,
                resource=group.resource,
                service_pascal=group.service_pascal,
                resource_pascal=group.resource_pascal,
                operations=tuple(operation_map[key]),
            )
        )
    return tuple(groups)


def _build_operation(
    spec: dict[str, Any],
    *,
    path: str,
    http_method: str,
    raw_operation: dict[str, Any],
    tag: str,
    service_pascal: str,
    resource_pascal: str,
) -> Operation:
    parameters = _parameters(spec, raw_operation, path)
    request_content_type, request_schema = _request_schema(spec, raw_operation)
    success_code, response_content_type, response_schema = _response_schema(spec, raw_operation)
    response_data_schema = _data_schema(response_schema)
    has_data_property = _has_data_property(response_schema)

    return Operation(
        operation_id=str(raw_operation["operationId"]),
        method_name=to_snake(
            operation_id_to_method_name(
                str(raw_operation["operationId"]),
                service_pascal,
                resource_pascal,
            )
        ),
        http_method=http_method,
        path=path,
        tag=tag,
        auth_mode=_auth_mode(raw_operation),
        request_content_type=request_content_type,
        response_content_type=response_content_type,
        success_code=success_code,
        has_request_body=request_schema is not None,
        has_data_property=has_data_property,
        is_list_response=_is_list_response(response_schema),
        path_parameters=tuple(p for p in parameters if p.location == "path"),
        query_parameters=tuple(p for p in parameters if p.location == "query"),
        header_parameters=tuple(p for p in parameters if p.location == "header"),
        request_schema=request_schema,
        response_schema=response_schema,
        response_data_schema=response_data_schema,
        requires_messaging_profile=any(
            p.location == "header" and p.name.lower() == "messaging-profile-id"
            for p in parameters
        ),
    )


def _parameters(
    spec: dict[str, Any],
    operation: dict[str, Any],
    path: str,
) -> list[Parameter]:
    declared = operation.get("parameters", [])
    declared_parameters: list[Parameter] = []
    if isinstance(declared, list):
        for raw_parameter in declared:
            parameter = maybe_resolve_ref(spec, raw_parameter)
            if not isinstance(parameter, dict):
                continue
            location = parameter.get("in")
            name = parameter.get("name")
            if not isinstance(location, str) or not isinstance(name, str):
                continue
            if name == "Conjoin-Request-Id":
                continue
            schema = maybe_resolve_ref(spec, parameter.get("schema"))
            declared_parameters.append(
                Parameter(
                    name=name,
                    python_name=to_snake(name),
                    location=location,
                    required=bool(parameter.get("required")),
                    schema=schema if isinstance(schema, dict) else {},
                )
            )

    existing_path_names = {p.name for p in declared_parameters if p.location == "path"}
    for path_name in _extract_path_parameter_names(path):
        if path_name not in existing_path_names:
            declared_parameters.append(
                Parameter(
                    name=path_name,
                    python_name=to_snake(path_name),
                    location="path",
                    required=True,
                    schema={"type": "string"},
                )
            )
    return declared_parameters


def _extract_path_parameter_names(path: str) -> tuple[str, ...]:
    return tuple(match.group(1) for match in re.finditer(r"\{(\w+)\}", path))


def _request_schema(
    spec: dict[str, Any],
    operation: dict[str, Any],
) -> tuple[str, dict[str, Any] | None]:
    request_body = maybe_resolve_ref(spec, operation.get("requestBody"))
    if not isinstance(request_body, dict):
        return "application/json", None
    content = request_body.get("content")
    if not isinstance(content, dict) or not content:
        return "application/json", None
    content_type = next(iter(content))
    media = content.get(content_type)
    if not isinstance(media, dict):
        return content_type, None
    schema = maybe_resolve_ref(spec, media.get("schema"))
    return content_type, schema if isinstance(schema, dict) else None


def _response_schema(spec: dict[str, Any], operation: dict[str, Any]) -> tuple[str, str, dict[str, Any]]:
    responses = operation.get("responses")
    if not isinstance(responses, dict):
        return "200", "application/json", {}
    success_code = next((str(code) for code in responses if str(code).startswith("2")), "200")
    response = maybe_resolve_ref(spec, responses.get(success_code))
    if not isinstance(response, dict):
        return success_code, "application/json", {}
    content = response.get("content")
    if not isinstance(content, dict) or not content:
        return success_code, "application/json", {}
    content_type = next(iter(content))
    media = content.get(content_type)
    if not isinstance(media, dict):
        return success_code, content_type, {}
    schema = maybe_resolve_ref(spec, media.get("schema"))
    return success_code, content_type, schema if isinstance(schema, dict) else {}


def _has_data_property(response_schema: dict[str, Any]) -> bool:
    properties = response_schema.get("properties")
    return isinstance(properties, dict) and "data" in properties


def _data_schema(response_schema: dict[str, Any]) -> dict[str, Any]:
    properties = response_schema.get("properties")
    if not isinstance(properties, dict):
        return response_schema
    data_schema = properties.get("data")
    if not isinstance(data_schema, dict):
        return response_schema
    if data_schema.get("type") == "array" and isinstance(data_schema.get("items"), dict):
        return data_schema["items"]
    return data_schema


def _is_list_response(response_schema: dict[str, Any]) -> bool:
    properties = response_schema.get("properties")
    if not isinstance(properties, dict):
        return False
    data_schema = properties.get("data")
    return isinstance(data_schema, dict) and data_schema.get("type") == "array"


def _auth_mode(operation: dict[str, Any]) -> AuthMode:
    security = operation.get("security")
    if not isinstance(security, list):
        return "default"
    if not security:
        return "none"
    for requirement in security:
        if isinstance(requirement, dict) and "scimBearer" in requirement:
            return "scim_bearer"
    return "default"
