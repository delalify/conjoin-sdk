# conjoin-cloud

Official Python SDK for Conjoin.

Provides typed sync and async clients, generated REST resources from the Conjoin OpenAPI spec, storage upload/download helpers, AI chat helpers, messaging profile scoping, retries, request tracing, response metadata, and typed Conjoin errors.

Requires Python 3.10 or newer.

## Install

Install with:

```bash
pip install conjoin-cloud
```

## Authentication

Create a client with exactly one credential mode:

```python
from conjoin_cloud import Conjoin

client = Conjoin(api_key="ck_test_...")
```

You can also use a publishable key:

```python
client = Conjoin(publishable_key="pk_test_...")
```

If no explicit key is passed, the SDK reads `CONJOIN_API_KEY` or `CONJOIN_PUBLISHABLE_KEY` from the environment. Set only one of them. The SDK does not load `.env` files.

## Sync Client

Use `Conjoin` for ordinary blocking code:

```python
from conjoin_cloud import Conjoin

with Conjoin(api_key="ck_test_...") as client:
    page = client.auth.accounts.list(query={"limit": 10})

    for account in page.data:
        print(account.account_id)
```

Generated resources are grouped by service and resource:

```python
page = client.auth.accounts.list(query={"limit": 25})
customer = client.billing.customers.read("ent_123", "cust_123")
profile_page = client.messaging.profiles.list(data={"sort": {"date_created": "desc"}})
```

Responses are Pydantic models. Python attributes are snake_case, and API wire aliases are preserved when dumping with aliases:

```python
payload = page.data[0].model_dump(by_alias=True)
```

For unsupported or newly released endpoints, use the generic request escape hatch:

```python
customer = client.request("GET", "billing/customers/cust_123")
```

## Async Client

Use `AsyncConjoin` with `async with`:

```python
from conjoin_cloud import AsyncConjoin


async def main() -> None:
    async with AsyncConjoin(api_key="ck_test_...") as client:
        page = await client.auth.accounts.list(query={"limit": 10})
        for account in page.data:
            print(account.account_id)
```

The async client has the same generated resource shape as the sync client.

## Request Options and Metadata

Every generated endpoint accepts `request_options` for SDK-owned per-call behavior:

```python
from conjoin_cloud import RequestOptions

account = client.auth.accounts.read(
    "app_123",
    "acct_123",
    request_options=RequestOptions(
        timeout=10,
        max_retries=1,
        conjoin_request_id="cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1",
    ),
)
```

Use `with_response` when you need status, headers, or the request ID:

```python
result = client.with_response.request(
    "GET",
    "auth/account/",
    query={"limit": 1},
)

print(result.status_code)
print(result.request_id)
print(result.data)
```

Parsed models also keep `_request_id` where the API response includes one.

## Pagination

List endpoints return typed `Page[T]` objects by default:

```python
page = client.auth.accounts.list(query={"limit": 100})

if page.cursor and page.cursor.next:
    next_page = client.auth.accounts.list(
        query={"limit": 100, "cursor": {"next": page.cursor.next}},
    )
```

Pagination is explicit. Keep your original filters and pass `cursor[next]` on the next list call.

## Storage

Use `client.storage.upload(...)` for single or resumable signed URL uploads. `body` can be bytes, a path, a binary file object, or an iterable of bytes. Resumable uploads require a chunk size aligned to 256 KiB; the default is 8 MiB.

```python
from pathlib import Path

from conjoin_cloud import Conjoin, UploadProgress


def report_progress(progress: UploadProgress) -> None:
    print(f"{progress.loaded}/{progress.total} bytes")


with Conjoin(api_key="ck_test_...") as client:
    client.storage.upload(
        container="container_123",
        path="reports/monthly.csv",
        content_type="text/csv",
        body=Path("monthly.csv"),
        on_progress=report_progress,
    )
```

Downloads are context-managed so the response stream is closed:

```python
with client.storage.download(container="container_123", path="reports/monthly.csv") as download:
    data = download.read()
```

## AI Chat

Use `client.ai.chat.complete(...)` for a non-streaming chat completion:

```python
response = client.ai.chat.complete(
    model="your-model",
    messages=[{"role": "user", "content": "Write a concise status update."}],
)

print(response.choices[0].message.content)
```

Use `client.ai.chat.stream(...)` for typed SSE chunks:

```python
for chunk in client.ai.chat.stream(
    model="your-model",
    messages=[{"role": "user", "content": "Stream one sentence."}],
):
    for choice in chunk.choices:
        if choice.delta.content:
            print(choice.delta.content, end="")
```

The async client supports `await client.ai.chat.complete(...)` and `async for chunk in client.ai.chat.stream(...)`.

## Messaging Email

Messaging operations that require `Messaging-Profile-ID` are scoped with `with_profile(...)`:

```python
message = client.messaging.with_profile("msg_profile_123").emails.send(
    data={
        "from_": "sender@example.com",
        "to": ["recipient@example.com"],
        "subject": "Hello",
        "text": "Body",
    },
)

print(message.message_id)
```

Use `from_` for the Python field name; the SDK sends the wire field as `from`.

## SCIM

Tenant SCIM operations use a SCIM bearer token instead of the normal Conjoin API key:

```python
users = client.auth.scim.with_token("scim_token_...").scim_list_users(
    "cnj_proj_123",
    "app_123",
)
```

Public SCIM metadata endpoints, such as schemas and resource types, remain callable without a SCIM token.

## Errors

All SDK errors inherit from `ConjoinError`:

```python
from conjoin_cloud import ConjoinError

try:
    client.auth.accounts.read("app_123", "acct_missing")
except ConjoinError as error:
    print(error.code)
    print(error.status_code)
    print(error.request_id)
```

Focused subclasses include connection, timeout, authentication, permission denied, not found, validation, rate limit, internal server, response validation, configuration, and storage errors.

## Examples

Focused examples live in `examples/`:

- `package_metadata.py`
- `sync_client.py`
- `async_client.py`
- `pagination.py`
- `storage_upload_download.py`
- `ai_streaming.py`
- `messaging_email.py`

They do not execute network calls when imported. Running them requires live credentials and any IDs, model names, or local files referenced by the example.

## Development

From this package directory:

```bash
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -e ".[dev]"
python3 -m pytest
python3 -m ruff check src tests examples scripts codegen
python3 -m pyright
python3 -m hatchling build
```

From the repository root:

```bash
pnpm nx run sdk-python:generate
pnpm nx run sdk-python:lint
pnpm nx run sdk-python:typecheck
pnpm nx run sdk-python:test
pnpm nx run sdk-python:build
```

Root Nx targets use `scripts/run_python.py`, which prefers `CONJOIN_PYTHON`, then this package's `.venv`, then an active `VIRTUAL_ENV`, then the current interpreter.
