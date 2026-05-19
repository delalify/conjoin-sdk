from __future__ import annotations

from pathlib import Path

from codegen.ir import collect_operations, collect_resource_groups
from codegen.render import render_all
from codegen.spec import load_openapi


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


def test_generated_output_has_no_internal_rollout_terms() -> None:
    generated_root = Path("src/conjoin_cloud/generated")
    combined = "\n".join(
        path.read_text(encoding="utf-8")
        for path in sorted(generated_root.rglob("*.py"))
    ).lower()

    assert "phase 4" not in combined
    assert "seeded" not in combined
    assert "seed openapi" not in combined
