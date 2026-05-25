# conjoin-cloud

`conjoin-cloud` is the official Python SDK for Conjoin. It includes sync and async clients, generated REST resources, storage upload and download helpers, AI chat helpers, messaging profile scoping, retries, request tracing, response metadata, and typed Conjoin errors.

Python 3.10 or later is required.

## Install

Install the package with pip:

```bash
pip install conjoin-cloud
```

## Authentication

Create a client with one credential mode:

```python
from conjoin_cloud import Conjoin

client = Conjoin(api_key='ck_test_...')
```

You can use a publishable key for browser-adjacent flows:

```python
client = Conjoin(publishable_key='pk_test_...')
```

The client reads `CONJOIN_API_KEY` or `CONJOIN_PUBLISHABLE_KEY` when you omit explicit credentials. Set one variable for a process. Load `.env` files in your application before you create the client.

## Sync Client

Use `Conjoin` in blocking Python code:

```python
from conjoin_cloud import Conjoin

with Conjoin(api_key='ck_test_...') as client:
    page = client.auth.accounts.list(query={'limit': 10})

    for account in page.data:
        print(account.account_id)
```

Generated resources are grouped by service and resource:

```python
page = client.auth.accounts.list(query={'limit': 25})
customer = client.billing.customers.read('ent_123', 'cust_123')
profiles = client.messaging.profiles.list(data={'sort': {'date_created': 'desc'}})
```

Generated responses use Pydantic models. Python attributes use `snake_case`, and API wire aliases stay available when you dump a model with aliases:

```python
payload = page.data[0].model_dump(by_alias=True)
```

Use `client.request(...)` when you need an endpoint before a generated wrapper exists:

```python
customer = client.request('GET', 'billing/customers/cust_123')
```

## Async Client

Use `AsyncConjoin` with `async with`:

```python
from conjoin_cloud import AsyncConjoin


async def main() -> None:
    async with AsyncConjoin(api_key='ck_test_...') as client:
        page = await client.auth.accounts.list(query={'limit': 10})

        for account in page.data:
            print(account.account_id)
```

The async client has the same generated resource shape as the sync client.

## Request Options and Response Metadata

Every generated endpoint accepts `request_options` for per-call SDK behavior:

```python
from conjoin_cloud import RequestOptions

account = client.auth.accounts.read(
    'app_123',
    'acct_123',
    request_options=RequestOptions(
        timeout=10,
        max_retries=1,
        conjoin_request_id='cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1',
    ),
)
```

Use `with_response` when you need the HTTP response metadata:

```python
result = client.with_response.request(
    'GET',
    'auth/account/',
    query={'limit': 1},
)

print(result.status_code)
print(result.request_id)
print(result.data)
```

Parsed models also keep `_request_id` when the API response includes one.

## Pagination

List endpoints return typed `Page[T]` objects:

```python
page = client.auth.accounts.list(query={'limit': 100})

if page.cursor and page.cursor.next:
    next_page = client.auth.accounts.list(
        query={'limit': 100, 'cursor': {'next': page.cursor.next}},
    )
```

Pagination is explicit. Keep your original filters and pass `cursor[next]` on the next list call.

## Storage

Use `client.storage.upload(...)` for single or resumable signed URL uploads. `body` accepts bytes, a path, a binary file object, or an iterable of bytes. Resumable uploads require a chunk size aligned to 256 KiB. The default chunk size is 8 MiB.

```python
from pathlib import Path

from conjoin_cloud import Conjoin, UploadProgress


def report_progress(progress: UploadProgress) -> None:
    print(f'{progress.loaded}/{progress.total} bytes')


with Conjoin(api_key='ck_test_...') as client:
    client.storage.upload(
        container='container_123',
        path='reports/monthly.csv',
        content_type='text/csv',
        body=Path('monthly.csv'),
        on_progress=report_progress,
    )
```

Downloads are context-managed so the response stream closes after use:

```python
with client.storage.download(container='container_123', path='reports/monthly.csv') as download:
    data = download.read()
```

## AI Chat

Call `client.ai.chat.complete(...)` for a non-streaming chat completion:

```python
response = client.ai.chat.complete(
    model='your-model-id',
    messages=[{'role': 'user', 'content': 'Write a concise account update.'}],
)

print(response.choices[0].message.content)
```

Call `client.ai.chat.stream(...)` for typed SSE chunks:

```python
for chunk in client.ai.chat.stream(
    model='your-model-id',
    messages=[{'role': 'user', 'content': 'Stream a short payment reminder.'}],
):
    for choice in chunk.choices:
        if choice.delta.content:
            print(choice.delta.content, end='')
```

The async client supports `await client.ai.chat.complete(...)` and `async for chunk in client.ai.chat.stream(...)`.

## Messaging Email

Messaging operations that require `Messaging-Profile-ID` are scoped with `with_profile(...)`:

```python
message = client.messaging.with_profile('msg_profile_123').emails.send(
    data={
        'from_': 'sender@example.com',
        'to': ['recipient@example.com'],
        'subject': 'Welcome',
        'text': 'Thanks for creating your account.',
    },
)

print(message.message_id)
```

Use `from_` as the Python field name because Python reserves `from`. The SDK sends the wire field as `from`.

## SCIM

Tenant SCIM operations use a SCIM bearer token:

```python
users = client.auth.scim.with_token('scim_token_...').scim_list_users(
    'cnj_proj_123',
    'app_123',
)
```

Public SCIM metadata endpoints, such as schemas and resource types, remain callable through the normal client.

## Errors

All SDK errors inherit from `ConjoinError`:

```python
from conjoin_cloud import ConjoinError

try:
    client.auth.accounts.read('app_123', 'acct_missing')
except ConjoinError as error:
    print(error.code)
    print(error.status_code)
    print(error.request_id)
```

Focused subclasses cover connection failures, timeouts, authentication failures, permission denials, missing resources, validation errors, rate limits, server errors, response validation errors, configuration errors, and storage errors.

## Examples

The `examples/` directory includes focused scripts:

- `package_metadata.py` prints package metadata.
- `sync_client.py` shows sync client setup.
- `async_client.py` shows async client setup.
- `pagination.py` fetches cursor-paginated account pages.
- `storage_upload_download.py` uploads and downloads a storage object.
- `ai_streaming.py` streams chat chunks.
- `messaging_email.py` sends a profile-scoped email.

The examples avoid network calls when imported. Running them requires live credentials and any IDs, model names, or local files referenced by the script.

## Development

Create the Python environment from this package directory:

```bash
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -e ".[dev]"
```

Run package checks from this directory:

```bash
python3 -m pytest
python3 -m ruff check src tests examples scripts codegen
python3 -m pyright
python3 -m hatchling build
```

Run Nx tasks from the repository root:

```bash
pnpm nx run sdk-python:generate
pnpm nx run sdk-python:lint
pnpm nx run sdk-python:typecheck
pnpm nx run sdk-python:test
pnpm nx run sdk-python:build
```

Root Nx targets use `scripts/run_python.py`. The runner prefers `CONJOIN_PYTHON`, then this package's `.venv`, then an active `VIRTUAL_ENV`, then the current interpreter.
