# conjoin-cloud

Official Python SDK package for Conjoin.

This package is in active implementation. It currently exposes the hand-written sync and async SDK core: client configuration, auth resolution, request options, retries, typed errors, response metadata wrappers, `httpx` lifecycle management, and base Pydantic models. Generated REST resource namespaces will be added in later implementation phases.

## Install

Once published to PyPI, install it with:

```bash
pip install conjoin-cloud
```

## Current Surface

```python
from conjoin_cloud import Conjoin, DEFAULT_API_VERSION, __version__

client = Conjoin(api_key="ck_test_...")

customer = client.request("GET", "billing/customers/cust_123")
```

```python
from conjoin_cloud import AsyncConjoin


async def main() -> None:
    async with AsyncConjoin(api_key="ck_test_...") as client:
        customer = await client.request("GET", "billing/customers/cust_123")
        print(customer)
```

Generated resource methods, pagination iterators, storage helpers, AI streaming helpers, and messaging profile helpers are not exposed yet.

## Development

From this package directory:

```bash
python3 -m venv .venv
. .venv/bin/activate
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
