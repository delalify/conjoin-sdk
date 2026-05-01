# @conjoin-cloud/sdk

The official TypeScript SDK for [Conjoin](https://conjoin.delalify.com). Nine products, sixteen tree-shakeable subpath imports, ESM + CJS, signed npm provenance.

[![npm version](https://img.shields.io/npm/v/@conjoin-cloud/sdk)](https://www.npmjs.com/package/@conjoin-cloud/sdk)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Install

```bash
npm install @conjoin-cloud/sdk
# pnpm add @conjoin-cloud/sdk
# yarn add @conjoin-cloud/sdk
```

Optional peers — install only what you actually use:

| Peer | Required for |
|---|---|
| `react`, `react-dom` (>=18) | `@conjoin-cloud/sdk/react` |
| `next` (>=14) | `@conjoin-cloud/sdk/next` |
| `express` (>=4), `@types/express` | `@conjoin-cloud/sdk/express` |
| `hono` (>=4) | `@conjoin-cloud/sdk/hono` |
| `expo-secure-store` (>=13) | `@conjoin-cloud/sdk/expo` |

## Quick start

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
```

Each subpath import only pulls in the code for that product. Importing `@conjoin-cloud/sdk/billing` does not bundle `auth`, `storage`, or anything else.

## Subpath exports

| Export | What it ships |
|---|---|
| `@conjoin-cloud/sdk` | `createConjoinClient`, error classes, shared types |
| `@conjoin-cloud/sdk/auth` | Accounts, sessions, OAuth, organizations, passkeys, MFA, SCIM |
| `@conjoin-cloud/sdk/billing` | Customers, subscriptions, invoices, products, prices, payment methods, entitlements |
| `@conjoin-cloud/sdk/storage` | Containers, objects, signed uploads, signed downloads, ACLs |
| `@conjoin-cloud/sdk/messaging` | Email, SMS, contacts, conversations, templates, OTP — profile-scoped |
| `@conjoin-cloud/sdk/relay` | WebSocket broadcast, queues, events, scheduler, memorystore, search |
| `@conjoin-cloud/sdk/ai` | Chat completions (streaming + non-streaming), models, providers, usage |
| `@conjoin-cloud/sdk/cloud` | Platform — API keys, roles, projects, webhooks, audit, plans |
| `@conjoin-cloud/sdk/database` | Reserved; not yet implemented |
| `@conjoin-cloud/sdk/runtime` | Reserved; not yet implemented |
| `@conjoin-cloud/sdk/react` | Web React hooks, components, `<ConjoinProvider>` |
| `@conjoin-cloud/sdk/expo` | Expo React Native hooks and `<ConjoinProvider>` |
| `@conjoin-cloud/sdk/server` | `verifyToken`, `verifyWebhook`, `createConjoinServer`, `fetchConjoinBranding` |
| `@conjoin-cloud/sdk/next` | `auth()`, `currentAccount()`, `conjoinProxy`, `createRouteMatcher` |
| `@conjoin-cloud/sdk/express` | `conjoinMiddleware`, `getAuth`, `requireAuth` |
| `@conjoin-cloud/sdk/hono` | `conjoinMiddleware`, `getAuth`, `requireAuth` |

## Configuration

```ts
const conjoin = createConjoinClient({
  apiKey: 'ck_live_...',           // server-side
  // or:
  publishableKey: 'pk_live_...',   // browser-side
  baseUrl: 'https://api.conjoin.cloud',
  apiVersion: '2025-01-01',
  timeout: 30_000,
  retry: {
    maxRetries: 3,
    backoffMs: 500,
  },
})
```

You must provide either `apiKey` or `publishableKey`. Keys prefixed with `ck_test_` and `pk_test_` hit the test environment; `ck_live_` and `pk_live_` keys hit production.

The SDK retries automatically on `429` and `5xx` responses with exponential backoff (initial `backoffMs`, doubled each retry, up to `maxRetries`). Authentication and validation errors are not retried.

## Auth

```ts
import { createAuthAccounts, createAuthSessions } from '@conjoin-cloud/sdk/auth'

const accounts = createAuthAccounts(conjoin)
const sessions = createAuthSessions(conjoin)

const account = await accounts.create('app_123', {
  email: 'user@example.com',
  password: 'a-secure-password',
})

const session = await sessions.create('app_123', { /* session payload */ })
```

`appId` is the first argument on every auth call because accounts and sessions are scoped to a Conjoin auth application.

## Billing

```ts
import {
  createBillingCustomers,
  createBillingSubscriptions,
} from '@conjoin-cloud/sdk/billing'

const customers = createBillingCustomers(conjoin)
const subscriptions = createBillingSubscriptions(conjoin)

const customer = await customers.create('entity_123', {
  name: 'Acme Corp',
  email: 'billing@acme.com',
})

const page = await customers.list('entity_123', { limit: 20 })
if (page.cursor?.next) {
  await customers.list('entity_123', { limit: 20, cursor: page.cursor.next })
}
```

`entityId` is the first argument on every billing call. List endpoints return cursor-based pagination on `cursor.next`.

## Storage

Uploads and downloads use signed URLs under the hood, so they work from the browser or from server runtimes without proxying bytes through the API.

```ts
import { createStorageUploader, createStorageDownloader } from '@conjoin-cloud/sdk/storage'

const uploader = createStorageUploader(conjoin)
const downloader = createStorageDownloader(conjoin)

await uploader.upload({
  container: 'my-bucket',
  path: 'reports/q4.pdf',
  contentType: 'application/pdf',
  body: file,                          // File | Blob | Buffer | ArrayBuffer | Uint8Array | ReadableStream
  onProgress: ({ percentage }) => console.log(`${percentage.toFixed(1)}%`),
})

const result = await downloader.download({
  container: 'my-bucket',
  path: 'reports/q4.pdf',
})
const blob = await result.blob()
```

For container and ACL administration, use `createStorageContainers(conjoin)` and `createStorageObjectAcls(conjoin)`.

## Messaging

Messaging operations are scoped to a profile, sent via the `Messaging-Profile-ID` header. Use the `createMessaging` helper to bind a profile once.

```ts
import { createMessaging } from '@conjoin-cloud/sdk/messaging'

const messaging = createMessaging(conjoin, { profileId: 'mp_123' })

await messaging.sms.sendSms({
  to: '+15551234567',
  body: 'Your code is 482910',
})

await messaging.emails.send({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome aboard</h1>',
})
```

`messaging` exposes namespaces: `emails`, `sms`, `multisend`, `contacts`, `conversations`, `templates`, `verifications`, `analytics`, `emailSenders`, `emailRecipients`, `smsSenders`, `smsBrands`, `smsCampaigns`, `smsRecipients`, `phoneNumbers`, and `profiles`.

## AI — chat

```ts
import { createAiChat } from '@conjoin-cloud/sdk/ai'

const chat = createAiChat(conjoin)

const response = await chat.complete({
  model: 'conjoin-4',
  messages: [{ role: 'user', content: 'Explain cursor-based pagination.' }],
})

const stream = chat.stream({
  model: 'conjoin-4',
  messages: [{ role: 'user', content: 'Stream me a haiku.' }],
})
for await (const chunk of stream) {
  process.stdout.write(chunk.choices?.[0]?.delta?.content ?? '')
}

stream.controller.abort()
```

`stream` returns an `AsyncIterable<ChatCompletionChunk>` plus an `AbortController` for cancellation.

## Relay — broadcast

```ts
import { createBroadcastConnection } from '@conjoin-cloud/sdk/relay'

const broadcast = createBroadcastConnection(conjoin, {
  channels: ['chat:room-42'],
})

broadcast.on('message', (channel, data) => {
  console.log(`[${channel}]`, data)
})

await broadcast.publish('chat:room-42', { user: 'alice', text: 'Hi everyone' })
```

For queues, events, scheduler, memorystore, and search, use the per-resource factories from `@conjoin-cloud/sdk/relay` (e.g. `createRelayQueues`, `createRelayEvents`, `createRelayScheduler`).

## React — web

```tsx
import { ConjoinProvider, useAuth, useSession, useAccount } from '@conjoin-cloud/sdk/react'
import '@conjoin-cloud/sdk/react/styles.css'

function App() {
  return (
    <ConjoinProvider publishableKey="pk_live_...">
      <Profile />
    </ConjoinProvider>
  )
}

function Profile() {
  const { isLoaded, isSignedIn } = useAuth()
  const session = useSession()
  const account = useAccount()

  if (!isLoaded) return <div>Loading…</div>
  if (!isSignedIn) return <a href="/sign-in">Sign in</a>

  return <div>Hello, {account.account?.email}</div>
}
```

`ConjoinProvider` accepts `publishableKey`, `config` (full SDK config object — typically derived from `fetchConjoinBranding`), `appearance` (theme `'light' | 'dark' | 'system'` and CSS variable overrides), and `cssLayerName` (for scoped Tailwind/CSS layers).

Available hooks: `useAuth`, `useSession`, `useAccount`, `useOrg`, `useEntitlements`, `useCheckout`, `useBundles`, `useChannel`, `useStorageUpload`, `useConjoinStatus`, `useConjoinTheme`.

Available components: `<SignIn>`, `<SignUp>`, `<AccountButton>`, `<AccountProfile>`, `<OrgSwitcher>`, `<PricingTable>`.

## Expo — React Native

```tsx
import { ConjoinProvider, useAuth, useSession } from '@conjoin-cloud/sdk/expo'

export default function Root({ children }) {
  return (
    <ConjoinProvider publishableKey="pk_live_...">
      {children}
    </ConjoinProvider>
  )
}
```

The Expo entry uses `expo-secure-store` for token persistence. The hook surface is identical to the web entry except components (which are web-only).

## Server — verification

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

`verifyToken` uses `jose` with a remote JWKS cached per `jwksUrl`. `verifyWebhook` is constant-time HMAC-SHA256 on a hex signature.

## Next.js — App Router

```ts
// app/layout.tsx — client side
import { ConjoinProvider } from '@conjoin-cloud/sdk/react'

// app/api/route.ts — server side
import { auth, currentAccount } from '@conjoin-cloud/sdk/next'

export async function GET() {
  const a = await auth()
  if (!a) return new Response('Unauthorized', { status: 401 })
  return Response.json({ accountId: a.accountId, getToken: a.getToken() })
}
```

For middleware-edge route protection:

```ts
// middleware.ts
import { conjoinProxy, createRouteMatcher } from '@conjoin-cloud/sdk/next'
import { NextResponse } from 'next/server'

const isProtected = createRouteMatcher(['/dashboard(.*)', '/settings(.*)'])

export default conjoinProxy((auth, req) => {
  if (isProtected(req) && !auth) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }
})
```

The proxy reads a client-state cookie at the edge (no JWT verification) — it's for routing decisions, not authorization. For real auth checks inside Server Components and Route Handlers, use `auth()`, which verifies the JWT against your JWKS.

## Express

```ts
import express from 'express'
import cookieParser from 'cookie-parser'
import { conjoinMiddleware, requireAuth } from '@conjoin-cloud/sdk/express'

const app = express()
app.use(cookieParser())
app.use(conjoinMiddleware({
  jwksUrl: 'https://your-tenant.conjoin.cloud/.well-known/jwks.json',
}))

app.get('/me', requireAuth, (req, res) => {
  res.json({ accountId: req.auth!.accountId })
})
```

`req.auth` is `VerifiedToken | null`. `requireAuth` short-circuits with `401` if missing. `getAuth(req)` returns the auth object or null.

## Hono

```ts
import { Hono } from 'hono'
import { conjoinMiddleware, requireAuth } from '@conjoin-cloud/sdk/hono'

const app = new Hono()
app.use('*', conjoinMiddleware({
  jwksUrl: 'https://your-tenant.conjoin.cloud/.well-known/jwks.json',
}))

app.get('/me', requireAuth, (c) => {
  const auth = c.get('auth')
  return c.json({ accountId: auth!.accountId })
})
```

`c.get('auth')` is `VerifiedToken | null`. `requireAuth` short-circuits with `401`. `getAuth(c)` returns the auth object or null.

## Errors

Every error extends `ConjoinError`. Catch broadly or narrow to a specific class.

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
  await customers.create('entity_123', data)
} catch (err) {
  if (err instanceof ConjoinValidationError) {
    for (const field of err.errors) {
      console.log(`${field.path}: ${field.message}`)
    }
  } else if (err instanceof ConjoinRateLimitError) {
    // err.retryAfter is in seconds
  } else if (err instanceof ConjoinAuthenticationError) {
    // 401, invalid or expired key
  }
}
```

| Class | When |
|---|---|
| `ConjoinAuthenticationError` | 401, invalid or missing key |
| `ConjoinValidationError` | 400, 422, with field-level details on `.errors` |
| `ConjoinRateLimitError` | 429, retry-after on `.retryAfter` |
| `ConjoinNetworkError` | DNS failure, connection refused |
| `ConjoinTimeoutError` | request exceeded the configured timeout |
| `ConjoinStorageError` | upload, download, or signed-URL failure |
| `ConjoinError` | base class for any other API error |

## Bundle

- 16 entry points, one per product or framework integration
- ESM + CJS for every entry, with matching `.d.ts` files
- `"sideEffects": ["./dist/react/styles.css"]` — only the React stylesheet has side effects
- Tree-shakeable factory functions (no static classes)
- All optional framework peers are externalised at build time

## Requirements

- **Node.js** 20.0.0 or later
- **TypeScript** 5.x for type-only consumers
- See the install table above for optional peer versions

## Support

- Documentation: <https://conjoin.delalify.com>
- Issues: <https://github.com/delalify/conjoin-sdk/issues>

## License

[MIT](./LICENSE)
