from __future__ import annotations

import asyncio
import json
from collections.abc import Callable
from typing import Any

import httpx
import pytest

from conjoin_cloud import AsyncConjoin, Conjoin, ConjoinConfigurationError, Page
from conjoin_cloud._transport import CONJOIN_REQUEST_ID_HEADER
from conjoin_cloud.generated._models import (
    AuthAccountListItem,
    AuthAccountListQuery,
    AuthSCIMScimGetResourceTypesResponse,
    AuthSCIMScimGetSchemasResponse,
    BillingCustomerListItem,
    MessagingEmailGetSummaryResponse,
    MessagingEmailSendResponse,
    MessagingProfileListItem,
    StorageContainerReadResponse,
)

VALID_REQUEST_ID = "cnj_req_0198f0f7-5d0b-7b4a-8d5a-cf5693f0b2c1"


def make_client(handler: Callable[[httpx.Request], httpx.Response]) -> Conjoin:
    http_client = httpx.Client(transport=httpx.MockTransport(handler))
    return Conjoin(api_key="ck_test_123", http_client=http_client, max_retries=0)


def make_async_client(handler: Callable[[httpx.Request], httpx.Response]) -> AsyncConjoin:
    http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return AsyncConjoin(api_key="ck_test_123", http_client=http_client, max_retries=0)


def json_response(request: httpx.Request, payload: dict[str, Any]) -> httpx.Response:
    return httpx.Response(
        200,
        json=payload,
        headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
        request=request,
    )


def auth_account_payload() -> dict[str, Any]:
    return {
        "account_id": "acct_123",
        "app_id": "app_123",
        "conjoin_account_id": "cnj_acct_123",
        "conjoin_project_id": "cnj_proj_123",
        "live_mode": False,
        "status": "active",
        "date_created": "2026-01-01T00:00:00Z",
        "date_updated": "2026-01-01T00:00:00Z",
    }


def messaging_profile_payload() -> dict[str, Any]:
    return {
        "profile_id": "msg_prof_123",
        "conjoin_account_id": "cnj_acct_123",
        "conjoin_project_id": "cnj_proj_123",
        "live_mode": False,
        "name": "Default",
        "is_system_profile": False,
        "resource_region": "us",
        "message_retention_days": 30,
        "features": {"sms": True, "email": True},
        "status": "active",
        "date_created": "2026-01-01T00:00:00Z",
        "date_updated": "2026-01-01T00:00:00Z",
    }


def billing_customer_payload() -> dict[str, Any]:
    return {
        "customer_id": "cust_123",
        "entity_id": "ent_123",
        "conjoin_account_id": "cnj_acct_123",
        "conjoin_project_id": "cnj_proj_123",
        "live_mode": False,
        "email": "billing@example.com",
        "name": "Acme",
        "reference_id": "ref_123",
        "status": "active",
        "date_created": "2026-01-01T00:00:00Z",
        "date_updated": "2026-01-01T00:00:00Z",
    }


def storage_container_payload() -> dict[str, Any]:
    return {
        "archived_date": None,
        "conjoin_account_id": "cnj_acct_123",
        "conjoin_project_id": "cnj_proj_123",
        "container_id": "container_123",
        "date_created": "2026-01-01T00:00:00Z",
        "date_updated": "2026-01-01T00:00:00Z",
        "deletion_grace_period_days": 30,
        "deletion_scheduled_at": None,
        "deletion_status": "active",
        "is_public": False,
        "lifecycle_policy": {},
        "live_mode": False,
        "metadata": {},
        "migration_status": "complete",
        "name": "container/a b",
        "reference_id": "ref_123",
        "region": "us",
        "settings": {},
        "storage_class": "standard",
        "storage_class_transition_policy": {},
        "versioning_enabled": False,
        "versioning_policy": {},
    }


def email_message_payload() -> dict[str, Any]:
    return {
        "message_id": "msg_123",
        "profile_id": "msg_prof_123",
        "conjoin_account_id": "cnj_acct_123",
        "conjoin_project_id": "cnj_proj_123",
        "live_mode": False,
        "type": "email",
        "from": "sender@example.com",
        "subject": "Hello",
        "body": "Body",
        "sent_at": "2026-01-01T00:00:00Z",
        "accepts_replies": True,
        "status": "sent",
        "date_created": "2026-01-01T00:00:00Z",
        "date_updated": "2026-01-01T00:00:00Z",
    }


def test_generated_services_are_wired_for_representative_resources() -> None:
    client = make_client(lambda request: json_response(request, {"data": []}))

    try:
        assert client.ai.models is not None
        assert client.auth.accounts is not None
        assert client.billing.customers is not None
        assert client.cloud.projects is not None
        assert client.messaging.profiles is not None
        assert client.relay.queues is not None
        assert client.storage.objects is not None
    finally:
        client.close()


def test_generated_auth_accounts_list_returns_typed_page() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(
            request,
            {"data": [auth_account_payload()], "cursor": {"next": "cursor_123"}},
        )

    client = make_client(handler)
    query: AuthAccountListQuery = {"limit": 50}

    try:
        page = client.auth.accounts.list(query=query)
    finally:
        client.close()

    assert seen_request is not None
    assert seen_request.method == "GET"
    assert str(seen_request.url).endswith("/v1/auth/account/?limit=50")
    assert isinstance(page, Page)
    assert isinstance(page.data[0], AuthAccountListItem)
    assert page.data[0].account_id == "acct_123"
    assert page.data[0]._request_id == VALID_REQUEST_ID
    assert page.cursor is not None
    assert page.cursor.next == "cursor_123"


def test_generated_messaging_profiles_list_preserves_cursor_and_body() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(
            request,
            {"data": [messaging_profile_payload()], "cursor": {"next": "cursor_456"}},
        )

    client = make_client(handler)

    try:
        page = client.messaging.profiles.list(data={"sort": {"date_created": "desc"}})
    finally:
        client.close()

    assert seen_request is not None
    assert seen_request.method == "POST"
    assert str(seen_request.url).endswith("/v1/messaging/profiles/")
    assert json.loads(seen_request.content) == {"sort": {"date_created": "desc"}}
    assert isinstance(page.data[0], MessagingProfileListItem)
    assert page.cursor is not None
    assert page.cursor.next == "cursor_456"


def test_generated_billing_customers_list_is_available() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return json_response(request, {"data": [billing_customer_payload()]})

    client = make_client(handler)

    try:
        page = client.billing.customers.list("ent_123")
    finally:
        client.close()

    assert isinstance(page.data[0], BillingCustomerListItem)
    assert page.data[0].customer_id == "cust_123"


def test_generated_list_operations_cover_all_services() -> None:
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path)
        return json_response(request, {"data": [], "cursor": {"next": "cursor_services"}})

    client = make_client(handler)

    try:
        pages = [
            client.ai.models.list(),
            client.cloud.projects.list("domain_123"),
            client.relay.queues.read_queue_definitions(),
            client.storage.containers.list(),
        ]
    finally:
        client.close()

    assert seen_paths == [
        "/v1/ai/model/models",
        "/v1/cloud/project/many/domain_123",
        "/v1/relay/queues/",
        "/v1/storage/storage-container/list",
    ]
    for page in pages:
        assert isinstance(page, Page)
        assert page.cursor is not None
        assert page.cursor.next == "cursor_services"


def test_generated_path_parameters_are_url_encoded() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(request, {"data": storage_container_payload()})

    client = make_client(handler)

    try:
        container = client.storage.containers.read("container/a b")
    finally:
        client.close()

    assert seen_request is not None
    assert str(seen_request.url).endswith(
        "/v1/storage/storage-container/details/container%2Fa%20b"
    )
    assert isinstance(container, StorageContainerReadResponse)
    assert container.name == "container/a b"


def test_generated_email_send_requires_profile_and_sends_multipart() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(request, {"data": email_message_payload()})

    client = make_client(handler)

    try:
        with pytest.raises(ConjoinConfigurationError):
            client.messaging.emails.send(data={"subject": "Hello"})

        message = client.messaging.with_profile("msg_prof_123").emails.send(
            data={"subject": "Hello", "from_": "sender@example.com", "to": ["user@example.com"]},
            request_options={"headers": {"Content-Type": "application/json"}},
        )
    finally:
        client.close()

    assert seen_request is not None
    assert seen_request.headers["Messaging-Profile-ID"] == "msg_prof_123"
    assert seen_request.headers["Content-Type"].startswith("multipart/form-data; boundary=")
    assert b'name="subject"' in seen_request.content
    assert b'name="from"' in seen_request.content
    assert b"from_" not in seen_request.content
    assert isinstance(message, MessagingEmailSendResponse)
    assert message.from_ == "sender@example.com"


def test_generated_get_operation_with_body_preserves_profile_scope() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(
            request,
            {
                "data": {
                    "cost_per_part": 0.01,
                    "currency": "USD",
                    "total_cost": 0.02,
                    "total_parts": 2,
                    "total_recipients": 1,
                }
            },
        )

    client = make_client(handler)

    try:
        summary = client.messaging.with_profile("msg_prof_123").emails.get_summary(
            data={"query": {"range": "today"}}
        )
    finally:
        client.close()

    assert seen_request is not None
    assert seen_request.method == "GET"
    assert seen_request.headers["Messaging-Profile-ID"] == "msg_prof_123"
    assert json.loads(seen_request.content) == {"query": {"range": "today"}}
    assert isinstance(summary, MessagingEmailGetSummaryResponse)
    assert summary.total_recipients == 1


def test_generated_scim_auth_modes_are_enforced() -> None:
    seen_requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_requests.append(request)
        if request.url.path.endswith("/ServiceProviderConfig"):
            return json_response(request, {"schemas": ["urn:ietf:params:scim:schemas:core:2.0"]})
        return json_response(
            request,
            {
                "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
                "totalResults": 0,
            },
        )

    client = make_client(handler)

    try:
        service_config = client.auth.scim.scim_get_service_provider_config()
        with pytest.raises(ConjoinConfigurationError):
            client.auth.scim.scim_list_users("proj_123", "app_123")
        users = client.auth.scim.with_token("scim_token_123").scim_list_users(
            "proj_123",
            "app_123",
        )
    finally:
        client.close()

    assert service_config.schemas == ["urn:ietf:params:scim:schemas:core:2.0"]
    assert users.total_results == 0
    assert "Authorization" not in seen_requests[0].headers
    assert seen_requests[1].headers["Authorization"] == "Bearer scim_token_123"


def test_generated_scim_metadata_and_no_content_responses() -> None:
    seen_requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_requests.append(request)
        if request.url.path.endswith("/Schemas"):
            return json_response(
                request,
                {
                    "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
                    "Resources": [],
                    "totalResults": 0,
                },
            )
        if request.url.path.endswith("/ResourceTypes"):
            return json_response(
                request,
                {
                    "schemas": ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
                    "Resources": [],
                    "totalResults": 0,
                },
            )
        return httpx.Response(
            204,
            headers={CONJOIN_REQUEST_ID_HEADER: VALID_REQUEST_ID},
            request=request,
        )

    client = make_client(handler)

    try:
        schemas = client.auth.scim.scim_get_schemas()
        resource_types = client.auth.scim.scim_get_resource_types()
        result = client.auth.scim.with_token("scim_token_123").scim_delete_group(
            "proj/123",
            "app 123",
            "group/123",
        )
    finally:
        client.close()

    assert isinstance(schemas, AuthSCIMScimGetSchemasResponse)
    assert schemas.total_results == 0
    assert isinstance(resource_types, AuthSCIMScimGetResourceTypesResponse)
    assert resource_types.total_results == 0
    assert result is None
    assert "Authorization" not in seen_requests[0].headers
    assert "Authorization" not in seen_requests[1].headers
    assert seen_requests[2].headers["Authorization"] == "Bearer scim_token_123"
    assert str(seen_requests[2].url).endswith(
        "/v1/auth/scim/v2/proj%2F123/app%20123/Groups/group%2F123"
    )


def test_generated_async_resources_call_async_core() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(request, {"data": [auth_account_payload()]})

    async def run() -> Page[AuthAccountListItem]:
        client = make_async_client(handler)
        try:
            return await client.auth.accounts.list()
        finally:
            await client.aclose()

    page = asyncio.run(run())

    assert seen_request is not None
    assert seen_request.method == "GET"
    assert isinstance(page.data[0], AuthAccountListItem)


def test_generated_async_messaging_profile_scope() -> None:
    seen_request: httpx.Request | None = None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal seen_request
        seen_request = request
        return json_response(
            request,
            {
                "data": {
                    "cost_per_part": 0.01,
                    "currency": "USD",
                    "total_cost": 0.02,
                    "total_parts": 2,
                    "total_recipients": 1,
                }
            },
        )

    async def run() -> MessagingEmailGetSummaryResponse:
        client = make_async_client(handler)
        try:
            return await client.messaging.with_profile("msg_prof_123").emails.get_summary(
                data={"query": {"range": "today"}}
            )
        finally:
            await client.aclose()

    summary = asyncio.run(run())

    assert seen_request is not None
    assert seen_request.method == "GET"
    assert seen_request.headers["Messaging-Profile-ID"] == "msg_prof_123"
    assert isinstance(summary, MessagingEmailGetSummaryResponse)
