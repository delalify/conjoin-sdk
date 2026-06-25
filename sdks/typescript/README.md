# @conjoin-cloud/sdk

`@conjoin-cloud/sdk` is the official TypeScript SDK for [Conjoin](https://conjoin.delalify.com). The package provides generated REST resources, storage helpers, AI chat helpers, framework adapters, server verification helpers, retries, request tracing, and typed errors.

The package ships ESM and CJS builds. Each product has its own subpath export, so bundlers can include the code you import.

[![npm version](https://img.shields.io/npm/v/@conjoin-cloud/sdk)](https://www.npmjs.com/package/@conjoin-cloud/sdk)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

## Install

Install the package with your package manager:

```bash
npm install @conjoin-cloud/sdk
pnpm add @conjoin-cloud/sdk
yarn add @conjoin-cloud/sdk
```

Install peer dependencies for the entry points you import:

- Install `next` `>=16.2.6` when you import `@conjoin-cloud/sdk/next`.
- Install `express` `>=4.0.0` and `@types/express` `>=4.0.0` when you import `@conjoin-cloud/sdk/express`.
- Install `hono` `>=4.12.19` when you import `@conjoin-cloud/sdk/hono`.

## Quick Start

```ts
import { createConjoinClient } from '@conjoin-cloud/sdk'
import { createBillingCustomers } from '@conjoin-cloud/sdk/billing'

const conjoin = createConjoinClient({
  apiKey: 'ck_live_...',
})

const customers = createBillingCustomers(conjoin)

const customer = await customers.create('entity_123', {
  name: 'Acme Corp',
  email: 'billing@acme.com',
})

console.log(customer.customer_id)
```

Import the product entry point you need. Importing `@conjoin-cloud/sdk/billing` keeps the bundle focused on billing code.

## Subpath Exports

- Import `@conjoin-cloud/sdk` for `createConjoinClient`, shared types, and error classes.
- Import `@conjoin-cloud/sdk/auth` for accounts, sessions, OAuth, organizations, passkeys, MFA, and SCIM.
- Import `@conjoin-cloud/sdk/billing` for customers, subscriptions, invoices, products, prices, payment methods, and entitlements.
- Import `@conjoin-cloud/sdk/storage` for containers, objects, signed uploads, signed downloads, and ACLs.
- Import `@conjoin-cloud/sdk/messaging` for email, SMS, contacts, conversations, templates, OTP, and profile-scoped clients.
- Import `@conjoin-cloud/sdk/relay` for WebSocket broadcast, queues, events, scheduler, memorystore, and search.
- Import `@conjoin-cloud/sdk/ai` for chat completions, streaming, models, providers, and usage resources.
- Import `@conjoin-cloud/sdk/cloud` for API keys, roles, projects, webhooks, audit resources, and plans.
- Import `@conjoin-cloud/sdk/server` for `verifyToken`, `verifyWebhook`, `createConjoinServer`, and `fetchConjoinBranding`.
- Import `@conjoin-cloud/sdk/next` for `auth()`, `currentAccount()`, `conjoinProxy`, and `createRouteMatcher`.
- Import `@conjoin-cloud/sdk/express` for `conjoinMiddleware`, `getAuth`, and `requireAuth`.
- Import `@conjoin-cloud/sdk/hono` for `conjoinMiddleware`, `getAuth`, and `requireAuth`.
- Import `@conjoin-cloud/sdk/database` and `@conjoin-cloud/sdk/runtime` for reserved entry points.

## Configuration

Create one client and pass it to generated resource factories:

```ts
const conjoin = createConjoinClient({
  apiKey: 'ck_live_...',
  baseUrl: 'https://api.conjoin.cloud',
  apiVersion: '2025-01-01',
  timeout: 30_000,
  retry: {
    maxRetries: 3,
    backoffMs: 500,
  },
})
```

Use `apiKey` on the server. Use `publishableKey` in browser and mobile clients. Keys with the `ck_test_` and `pk_test_` prefixes use the test environment. Keys with the `ck_live_` and `pk_live_` prefixes use production.

The SDK retries `429` and `5xx` responses with exponential backoff. It starts with `backoffMs`, doubles the delay after each failed try, and stops after `maxRetries`. Authentication and validation errors return immediately.

## Auth

```ts
import { createAuthAccounts } from '@conjoin-cloud/sdk/auth'

const accounts = createAuthAccounts(conjoin)

const account = await accounts.create('app_123', {
  name: 'Taylor Morgan',
  primary_email: 'member@example.com',
  reference_id: 'member_123',
})

console.log(account.account_id)
```

Pass `appId` as the first argument on auth calls because accounts and sessions are scoped to a Conjoin auth application.

## Billing

```ts
import { createBillingCustomers } from '@conjoin-cloud/sdk/billing'

const customers = createBillingCustomers(conjoin)

const customer = await customers.create('entity_123', {
  name: 'Acme Corp',
  email: 'billing@acme.com',
})

const page = await customers.list('entity_123', { limit: 20 })

if (page.cursor?.next) {
  await customers.list('entity_123', {
    limit: 20,
    cursor: page.cursor.next,
  })
}
```

Pass `entityId` as the first argument on billing calls. List endpoints return cursor-based pagination through `cursor.next`.

## Storage

Uploads and downloads use signed URLs, so browser and server code can move bytes directly to storage:

```ts
import {
  createStorageDownloader,
  createStorageUploader,
} from '@conjoin-cloud/sdk/storage'

const uploader = createStorageUploader(conjoin)
const downloader = createStorageDownloader(conjoin)

await uploader.upload({
  container: 'reports',
  path: 'finance/q4.pdf',
  contentType: 'application/pdf',
  body: file,
  onProgress: ({ percentage }) => {
    console.log(`${percentage.toFixed(1)}%`)
  },
})

const result = await downloader.download({
  container: 'reports',
  path: 'finance/q4.pdf',
})

const blob = await result.blob()
```

Use `createStorageContainers(conjoin)` for container administration. Use `createStorageObjectAcls(conjoin)` for object ACLs.

## Messaging

Messaging operations use the `Messaging-Profile-ID` header. Bind a profile once with `createMessaging`:

```ts
import { createMessaging } from '@conjoin-cloud/sdk/messaging'

const messaging = createMessaging(conjoin, {
  profileId: 'msg_profile_123',
})

await messaging.sms.sendSms({
  to: '+15551234567',
  body: 'Your verification code is 482910.',
})

await messaging.emails.send({
  to: 'member@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome to Acme</h1>',
})
```

The profiled messaging client exposes `emails`, `sms`, `multisend`, `contacts`, `conversations`, `templates`, `verifications`, `analytics`, `emailSenders`, `smsSenders`, `smsBrands`, `smsCampaigns`, `phoneNumbers`, and `profiles`.

## AI Chat

```ts
import { createAiChat } from '@conjoin-cloud/sdk/ai'

const chat = createAiChat(conjoin)

const response = await chat.complete({
  model: 'your-model-id',
  messages: [{ role: 'user', content: 'Explain cursor-based pagination.' }],
})

const stream = chat.stream({
  model: 'your-model-id',
  messages: [{ role: 'user', content: 'Draft a short payment reminder.' }],
})

for await (const chunk of stream) {
  process.stdout.write(chunk.choices?.[0]?.delta?.content ?? '')
}

stream.controller.abort()
```

`stream` returns an `AsyncIterable<ChatCompletionChunk>` and an `AbortController`.

## Relay Broadcast

```ts
import { createBroadcastConnection } from '@conjoin-cloud/sdk/relay'

const broadcast = createBroadcastConnection(conjoin, {
  channels: ['support:room-42'],
})

broadcast.on('message', (channel, data) => {
  console.log(`[${channel}]`, data)
})

await broadcast.publish('support:room-42', {
  user: 'alice',
  text: 'The ticket is ready for review.',
})
```

Use the per-resource relay factories for queues, events, scheduler, memorystore, and search.

## Server Verification

```ts
import { verifyToken, verifyWebhook } from '@conjoin-cloud/sdk/server'

const verified = await verifyToken(token, {
  jwksUrl: 'https://your-tenant.conjoin.cloud/.well-known/jwks.json',
  audience: 'your-app',
  issuer: 'https://conjoin.cloud',
})

console.log(verified.accountId, verified.sessionId, verified.organizationId)

const ok = verifyWebhook(rawBody, signatureHeader, webhookSecret)
```

`verifyToken` uses `jose` with a remote JWKS cached per `jwksUrl`. `verifyWebhook` checks a hex HMAC-SHA256 signature in constant time.

## Next.js App Router

Read authenticated state in route handlers:

```ts
import { auth } from '@conjoin-cloud/sdk/next'

export async function GET() {
  const session = await auth()

  if (session === null) {
    return new Response('Unauthorized', { status: 401 })
  }

  return Response.json({ accountId: session.accountId })
}
```

Protect middleware routes with `conjoinProxy`. The handler is async because the proxy verifies the session token against your JWKS before exposing the identity:

```ts
import { conjoinProxy, createRouteMatcher } from '@conjoin-cloud/sdk/next'
import { NextResponse } from 'next/server'

const isProtected = createRouteMatcher(['/dashboard(.*)', '/settings(.*)'])

export default conjoinProxy((auth, req) => {
  if (isProtected(req) && auth === null) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
})
```

The proxy verifies the `__conjoin_auth_sess` cookie against your tenant JWKS and passes a verified identity (`accountId`, `organizationId`, `organizationRoles`, `has({ role })`) to the handler, or `null` when the token is missing or invalid. The token itself stays on the server: call `auth()` inside Server Components and Route Handlers when you need `getToken()`.

## Express

```ts
import express from 'express'
import {
  conjoinMiddleware,
  getAuth,
  requireAuth,
} from '@conjoin-cloud/sdk/express'

const app = express()

app.use(conjoinMiddleware({
  jwksUrl: 'https://your-tenant.conjoin.cloud/.well-known/jwks.json',
}))

app.get('/me', requireAuth, (req, res) => {
  const auth = getAuth(req)

  if (auth === null) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  res.json({ accountId: auth.accountId })
})
```

`getAuth(req)` returns `VerifiedToken | null`. `requireAuth` returns `401` when authentication is missing.

## Hono

```ts
import { Hono } from 'hono'
import {
  conjoinMiddleware,
  getAuth,
  requireAuth,
} from '@conjoin-cloud/sdk/hono'

const app = new Hono()

app.use('*', conjoinMiddleware({
  jwksUrl: 'https://your-tenant.conjoin.cloud/.well-known/jwks.json',
}))

app.get('/me', requireAuth, c => {
  const auth = getAuth(c)

  if (auth === null) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ accountId: auth.accountId })
})
```

`getAuth(c)` returns `VerifiedToken | null`. `requireAuth` returns `401` when authentication is missing.

## Errors

Every SDK error extends `ConjoinError`:

```ts
import {
  ConjoinAuthenticationError,
  ConjoinError,
  ConjoinNetworkError,
  ConjoinRateLimitError,
  ConjoinStorageError,
  ConjoinTimeoutError,
  ConjoinValidationError,
} from '@conjoin-cloud/sdk'

try {
  const customerInput = {
    name: 'Acme Corp',
    email: 'billing@acme.com',
  }

  await customers.create('entity_123', customerInput)
} catch (err) {
  if (err instanceof ConjoinValidationError) {
    for (const field of err.errors) {
      console.log(`${field.path}: ${field.message}`)
    }
  } else if (err instanceof ConjoinRateLimitError) {
    console.log(`Retry after ${err.retryAfter} seconds.`)
  } else if (err instanceof ConjoinAuthenticationError) {
    console.log('The API key is invalid or expired.')
  } else if (err instanceof ConjoinError) {
    console.log(err.message)
  }
}
```

- `ConjoinAuthenticationError` covers `401` responses.
- `ConjoinValidationError` covers `400` and `422` responses with field-level details on `.errors`.
- `ConjoinRateLimitError` covers `429` responses and exposes `.retryAfter`.
- `ConjoinNetworkError` covers DNS failures and refused connections.
- `ConjoinTimeoutError` covers requests that exceed the configured timeout.
- `ConjoinStorageError` covers upload, download, and signed URL failures.
- `ConjoinError` is the base class for other API errors.

## Bundle and Runtime

- The package exposes 14 entry points, one for each product or framework integration.
- Every entry point ships ESM, CJS, and `.d.ts` files.
- Factory functions let bundlers remove unused product code.
- Optional framework peer dependencies stay external at build time.

## Requirements

- Node.js 22.0.0 or later is required.
- TypeScript 5.x works for type-only consumers.
- Peer dependency versions are listed in the install section.

## Support

- Read product documentation at <https://conjoin.delalify.com>.
- Report SDK issues at <https://github.com/delalify/conjoin-sdk/issues>.

## License

This package uses the [MIT](../../LICENSE) license.
