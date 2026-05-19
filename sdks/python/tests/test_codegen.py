from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from codegen.ir import Operation, ResourceGroup, collect_operations, collect_resource_groups
from codegen.naming import to_kebab
from codegen.render import render_all
from codegen.spec import load_openapi

TYPESCRIPT_MODULES_ROOT = (
    Path(__file__).resolve().parents[2] / "typescript" / "src" / "generated" / "modules"
)
TYPE_ALIAS_PATTERN = re.compile(
    r"^type (?P<base>\w+)(?P<kind>Body|Data|Response|Query) = "
    r"(?:NonNullable<)?operations\['(?P<operation_id>[^']+)'\](?P<expression>.*)$",
    re.MULTILINE,
)
REQUEST_CONTENT_PATTERN = re.compile(r"\['requestBody'\]\['content'\]\['([^']+)'\]")
RESPONSE_CONTENT_PATTERN = re.compile(
    r"\['responses'\]\['([^']+)'\]\['content'\]\['([^']+)'\]"
)


@dataclass(frozen=True)
class OperationAudit:
    operation_id: str
    http_method: str
    path: str
    service: str
    resource: str
    request_content_type: str
    response_content_type: str
    success_code: str
    auth_mode: str
    is_list_response: bool
    requires_messaging_profile: bool


def test_generator_ir_collects_all_tagged_resource_operations() -> None:
    spec = load_openapi()
    operations = collect_operations(spec)
    groups = collect_resource_groups(spec)

    assert len(operations) == 543
    assert sum(len(group.operations) for group in groups) == 543
    assert len(groups) == 96
    assert {group.service for group in groups} == {
        "ai",
        "auth",
        "billing",
        "cloud",
        "messaging",
        "relay",
        "storage",
    }
    assert any(operation.request_content_type == "multipart/form-data" for operation in operations)
    assert any(operation.auth_mode == "scim_bearer" for operation in operations)
    assert any(operation.auth_mode == "none" for operation in operations)
    assert any(operation.requires_messaging_profile for operation in operations)


def test_typescript_and_python_generated_operation_coverage_are_in_lockstep() -> None:
    spec = load_openapi()
    operations = collect_operations(spec)
    groups = collect_resource_groups(spec)
    python_audits = _python_operation_audits(groups)
    typescript_audits = _typescript_operation_audits(operations)

    assert python_audits == typescript_audits
    _assert_typescript_aliases_match_openapi(operations)


def test_rendered_list_operations_return_page_types() -> None:
    from codegen.render import resolve_method_entries

    groups = collect_resource_groups(load_openapi())

    for group in groups:
        for entry in resolve_method_entries(group):
            if entry.operation.is_list_response:
                assert entry.response_type.startswith("Page[")
            else:
                assert not entry.response_type.startswith("Page[")


def test_generator_has_no_operation_allowlist() -> None:
    source = Path("codegen/ir.py").read_text(encoding="utf-8")

    assert "OPERATION_IDS" not in source
    assert "listAuthAccounts" not in source
    assert "sendEmail" not in source


def test_generator_render_is_deterministic(tmp_path: Path) -> None:
    groups = collect_resource_groups(load_openapi())
    first = tmp_path / "first"
    second = tmp_path / "second"

    render_all(groups, first)
    render_all(groups, second)

    first_files = {
        path.relative_to(first): path.read_text(encoding="utf-8")
        for path in sorted(first.rglob("*.py"))
    }
    second_files = {
        path.relative_to(second): path.read_text(encoding="utf-8")
        for path in sorted(second.rglob("*.py"))
    }

    assert first_files == second_files


def test_generated_output_is_current(tmp_path: Path) -> None:
    generated_root = Path("src/conjoin_cloud/generated")
    rendered = tmp_path / "rendered"

    render_all(collect_resource_groups(load_openapi()), rendered)

    rendered_files = {
        path.relative_to(rendered): path.read_text(encoding="utf-8")
        for path in sorted(rendered.rglob("*.py"))
    }
    generated_files = {
        path.relative_to(generated_root): path.read_text(encoding="utf-8")
        for path in sorted(generated_root.rglob("*.py"))
    }

    assert generated_files == rendered_files


def test_generated_typed_dicts_preserve_required_fields() -> None:
    models = Path("src/conjoin_cloud/generated/_models.py").read_text(encoding="utf-8")

    assert "class _AiBYOKCreateByokConfigRequestRequired(TypedDict):" in models
    assert "class AiBYOKCreateByokConfigRequest(" in models
    assert "_AiBYOKCreateByokConfigRequestRequired, total=False" in models
    assert "class _AuthSessionListByAccountQueryRequired(TypedDict):" in models
    assert "class AuthSessionListByAccountQuery(" in models
    assert "_AuthSessionListByAccountQueryRequired, total=False" in models


def test_generated_output_has_no_internal_rollout_terms() -> None:
    generated_root = Path("src/conjoin_cloud/generated")
    combined = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted(generated_root.rglob("*.py"))
    ).lower()

    assert "phase 4" not in combined
    assert "seeded" not in combined
    assert "seed openapi" not in combined


def test_generated_output_has_no_typescript_public_api_terms() -> None:
    generated_root = Path("src/conjoin_cloud/generated")
    combined = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted(generated_root.rglob("*.py"))
    )

    for forbidden in (
        "ConjoinClient",
        "operationId",
        "scimToken",
        "profileId",
        "camelCase",
        "createAuth",
        "createMessaging",
    ):
        assert forbidden not in combined


def _python_operation_audits(
    groups: tuple[ResourceGroup, ...],
) -> dict[str, OperationAudit]:
    audits: dict[str, OperationAudit] = {}
    for group in groups:
        for operation in group.operations:
            audits[operation.operation_id] = _operation_audit(
                operation,
                service=group.service,
                resource=to_kebab(group.resource),
            )
    return audits


def _typescript_operation_audits(
    operations: tuple[Operation, ...],
) -> dict[str, OperationAudit]:
    operation_map = {operation.operation_id: operation for operation in operations}
    groups = _typescript_operation_groups()

    assert set(groups) <= set(operation_map)

    return {
        operation_id: _operation_audit(
            operation_map[operation_id],
            service=service,
            resource=resource,
        )
        for operation_id, (service, resource) in groups.items()
    }


def _operation_audit(
    operation: Operation,
    *,
    service: str,
    resource: str,
) -> OperationAudit:
    return OperationAudit(
        operation_id=operation.operation_id,
        http_method=operation.http_method,
        path=operation.path,
        service=service,
        resource=resource,
        request_content_type=operation.request_content_type,
        response_content_type=operation.response_content_type,
        success_code=operation.success_code,
        auth_mode=operation.auth_mode,
        is_list_response=operation.is_list_response,
        requires_messaging_profile=operation.requires_messaging_profile,
    )


def _typescript_operation_groups() -> dict[str, tuple[str, str]]:
    groups: dict[str, tuple[str, str]] = {}
    assert TYPESCRIPT_MODULES_ROOT.exists()

    for path in sorted(TYPESCRIPT_MODULES_ROOT.glob("*.ts")):
        if path.name.endswith("-index.ts"):
            continue
        service, resource = path.stem.split("-", 1)
        text = path.read_text(encoding="utf-8")
        operation_ids = {match.group("operation_id") for match in TYPE_ALIAS_PATTERN.finditer(text)}
        assert operation_ids
        for operation_id in operation_ids:
            group = (service, resource)
            if operation_id in groups:
                assert groups[operation_id] == group
            groups[operation_id] = group

    return groups


def _assert_typescript_aliases_match_openapi(operations: tuple[Operation, ...]) -> None:
    aliases = _typescript_alias_metadata()

    for operation in operations:
        metadata = aliases[operation.operation_id]
        if operation.has_request_body:
            assert metadata["request_content_type"] == operation.request_content_type
        else:
            assert "request_content_type" not in metadata
        assert metadata["response_content_type"] == operation.response_content_type
        assert metadata["success_code"] == operation.success_code
        assert metadata["is_list_response"] == operation.is_list_response


def _typescript_alias_metadata() -> dict[str, dict[str, object]]:
    metadata: dict[str, dict[str, object]] = {}

    for path in sorted(TYPESCRIPT_MODULES_ROOT.glob("*.ts")):
        if path.name.endswith("-index.ts"):
            continue
        text = path.read_text(encoding="utf-8")
        for match in TYPE_ALIAS_PATTERN.finditer(text):
            operation_id = match.group("operation_id")
            operation_metadata = metadata.setdefault(operation_id, {})
            kind = match.group("kind")
            expression = match.group("expression")
            if kind == "Body":
                request_match = REQUEST_CONTENT_PATTERN.search(expression)
                assert request_match is not None
                operation_metadata["request_content_type"] = request_match.group(1)
            if kind in {"Data", "Response"}:
                response_match = RESPONSE_CONTENT_PATTERN.search(expression)
                assert response_match is not None
                operation_metadata["success_code"] = response_match.group(1)
                operation_metadata["response_content_type"] = response_match.group(2)
                operation_metadata["is_list_response"] = expression.endswith("[number]")

    return metadata
