# conjoin-cloud

Official Python SDK package for Conjoin.

This package is currently in its scaffold phase. It has package metadata, version handling, type marker support, test/lint/typecheck/build tooling, and the default API version constant. Runtime clients and generated REST resources will be added in later implementation phases.

## Install

Once published to PyPI, install it with:

```bash
pip install conjoin-cloud
```

## Current Surface

```python
from conjoin_cloud import DEFAULT_API_VERSION, __version__

print(__version__)
print(DEFAULT_API_VERSION)
```

The sync `Conjoin` client, async `AsyncConjoin` client, generated resource methods, pagination helpers, storage helpers, AI streaming helpers, and messaging profile helpers are not exposed by this scaffold yet.

## Development

From this package directory:

```bash
python3 -m pip install -e ".[dev]"
python3 -m pytest
python3 -m ruff check src tests examples
python3 -m pyright
python3 -m hatchling build
```

From the repository root:

```bash
pnpm nx run sdk-python:test
pnpm nx run sdk-python:lint
pnpm nx run sdk-python:typecheck
pnpm nx run sdk-python:build
```
