from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: python3 scripts/run_python.py [python-args...]", file=sys.stderr)
        return 2

    project_root = Path(__file__).resolve().parents[1]
    python = _resolve_python(project_root)
    try:
        return subprocess.call([str(python), *sys.argv[1:]], cwd=project_root)
    except FileNotFoundError:
        print(f"Python executable not found: {python}", file=sys.stderr)
        return 127


def _resolve_python(project_root: Path) -> Path:
    override = os.environ.get("CONJOIN_PYTHON")
    if override:
        return Path(override)

    project_venv = _venv_python(project_root / ".venv")
    if project_venv is not None:
        return project_venv

    active_venv = os.environ.get("VIRTUAL_ENV")
    if active_venv:
        active_python = _venv_python(Path(active_venv))
        if active_python is not None:
            return active_python

    return Path(sys.executable)


def _venv_python(venv: Path) -> Path | None:
    relative = Path("Scripts/python.exe") if os.name == "nt" else Path("bin/python")
    python = venv / relative
    return python if python.is_file() else None


if __name__ == "__main__":
    raise SystemExit(main())
