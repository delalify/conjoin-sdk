from __future__ import annotations

import shutil
from pathlib import Path

from codegen.ir import collect_resource_groups
from codegen.render import render_all
from codegen.spec import load_openapi


def main() -> None:
    spec = load_openapi()
    groups = collect_resource_groups(spec)
    render_all(groups)
    operation_count = sum(len(group.operations) for group in groups)
    _remove_bytecode_caches()
    print(
        f"Generated Python SDK resources for {operation_count} operations "
        f"in {len(groups)} groups."
    )


def _remove_bytecode_caches() -> None:
    codegen_dir = Path(__file__).resolve().parent
    cache_dir = codegen_dir / "__pycache__"
    if cache_dir.exists():
        shutil.rmtree(cache_dir)
