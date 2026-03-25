# Conjoin SDK

The official SDKs for [Conjoin](https://conjoin.delalify.com). One package per language, eight products, tree-shakeable from top to bottom.

[![npm version](https://img.shields.io/npm/v/@conjoin-cloud/sdk)](https://www.npmjs.com/package/@conjoin-cloud/sdk)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## Install

```bash
npm install @conjoin-cloud/sdk
```

```bash
pnpm add @conjoin-cloud/sdk
```

```bash
yarn add @conjoin-cloud/sdk
```

## Quick Start

Create a client with your API key, then import the products you need. Everything else gets stripped from your bundle.

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

## Products

Each product has its own sub-path import. You only bundle what you use.

| Product | Import | What it does |
| ------- | ------ | ------------ |
| **Auth** | `@conjoin-cloud/sdk/auth` | Accounts, sessions, OAuth flows, organizations, passkeys, MFA |
| **Billing** | `@conjoin-cloud/sdk/billing` | Customers, subscriptions, invoices, products, prices, payment methods |
| **Storage** | `@conjoin-cloud/sdk/storage` | File containers, object uploads/downloads, signed URLs, image optimization |
| **Messaging** | `@conjoin-cloud/sdk/messaging` | Email, SMS, contacts, conversations, templates, OTP |
| **Relay** | `@conjoin-cloud/sdk/relay` | WebSocket broadcast, queues, events, scheduler, memory store, search |
| **AI** | `@conjoin-cloud/sdk/ai` | Chat completions, model registry, providers, usage tracking |
| **Database** | `@conjoin-cloud/sdk/database` | Managed database client |
| **Runtime** | `@conjoin-cloud/sdk/runtime` | Container runtime management |

Platform management (API keys, roles, webhooks, audit logs, projects) is available via `@conjoin-cloud/sdk/cloud`.

## Usage

### Auth

```ts
import { createAuthAccounts, createAuthSessions } from '@conjoin-cloud/sdk/auth'

const accounts = createAuthAccounts(conjoin)
const sessions = createAuthSessions(conjoin)

const account = await accounts.create({
  email: 'user@example.com',
  password: 'securepassword123',
})

const session = await sessions.create({
  accountId: account.id,
  userAgent: 'MyApp/1.0',
})
```

### Billing

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

const subscription = await subscriptions.create('entity_123', {
  customerId: customer.id,
  priceId: 'price_pro_monthly',
})
```

### Storage

```ts
import { createStorageObjects } from '@conjoin-cloud/sdk/storage'

const objects = createStorageObjects(conjoin)

const uploaded = await objects.upload('my-bucket', {
  file: buffer,
  filename: 'report.pdf',
  contentType: 'application/pdf',
})

const signedUrl = await objects.getSignedUrl('my-bucket', uploaded.id, {
  expiresIn: 3600,
})
```

### Messaging

Messaging requires a profile ID, which gets sent as a header on every request.

```ts
import { createMessaging } from '@conjoin-cloud/sdk/messaging'

const messaging = createMessaging(conjoin, {
  profileId: 'mp_123',
})

await messaging.sms.send({
  to: '+15551234567',
  body: 'Your verification code is 482910',
})

await messaging.email.send({
  to: 'user@example.com',
  subject: 'Welcome to Acme',
  html: '<h1>Welcome aboard</h1>',
})
```

### AI (Streaming)

```ts
import { createAIChat } from '@conjoin-cloud/sdk/ai'

const chat = createAIChat(conjoin)

const stream = chat.streamCompletion({
  model: 'conjoin-4',
  messages: [{ role: 'user', content: 'Explain cursor-based pagination.' }],
})

for await (const chunk of stream) {
  process.stdout.write(chunk.content)
}
```

### Relay (Real-Time)

```ts
import { createBroadcastConnection } from '@conjoin-cloud/sdk/relay'

const broadcast = createBroadcastConnection(conjoin, {
  channels: ['chat:room-42'],
})

broadcast.on('message', (channel, data) => {
  console.log(`[${channel}]`, data)
})

broadcast.publish('chat:room-42', {
  user: 'alice',
  text: 'Hello everyone',
})
```

### Pagination

All list endpoints use cursor-based pagination.

```ts
import { createBillingCustomers } from '@conjoin-cloud/sdk/billing'

const customers = createBillingCustomers(conjoin)

const firstPage = await customers.list('entity_123', { limit: 20 })

if (firstPage.cursor?.next) {
  const secondPage = await customers.list('entity_123', {
    limit: 20,
    cursor: firstPage.cursor.next,
  })
}
```

## React

The React bindings wrap each product in hooks powered by [TanStack Query](https://tanstack.com/query). Install the peer dependencies first:

```bash
npm install react @tanstack/react-query
```

### Provider Setup

```tsx
import { ConjoinProvider } from '@conjoin-cloud/sdk/react'
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <ConjoinProvider
      config={{ apiKey: 'ck_live_...' }}
      queryClient={queryClient}
    >
      <YourApp />
    </ConjoinProvider>
  )
}
```

### Hooks

```tsx
import { useBillingCustomers } from '@conjoin-cloud/sdk/react'

function CustomerList({ entityId }: { entityId: string }) {
  const { customers, isLoading, create } = useBillingCustomers(entityId)

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {customers?.map(c => (
        <li key={c.id}>{c.name}</li>
      ))}
    </ul>
  )
}
```

Each hook only imports its own product module, so `useBillingCustomers` won't pull in auth or storage code.

## Server

Server-only utilities for webhook verification and middleware. These should only run in Node.js, not in the browser.

```ts
import { verifyWebhookSignature } from '@conjoin-cloud/sdk/server'
```

### Webhook Verification

```ts
import { verifyWebhookSignature } from '@conjoin-cloud/sdk/server'

const isValid = await verifyWebhookSignature({
  payload: request.body,
  signature: request.headers['x-conjoin-signature'],
  secret: 'whsec_...',
})
```

### Framework Middleware

```ts
import { createConjoinMiddleware } from '@conjoin-cloud/sdk/server'

const middleware = createConjoinMiddleware({
  webhookSecret: 'whsec_...',
  onEvent: async (event) => {
    switch (event.type) {
      case 'billing.subscription.created':
        // handle subscription creation
        break
      case 'auth.account.deleted':
        // handle account deletion
        break
    }
  },
})
```

Works with Express, Hono, and any framework that provides a standard `Request`/`Response` interface.

## Configuration

```ts
const conjoin = createConjoinClient({
  apiKey: 'ck_live_...',
  baseUrl: 'https://api.conjoin.cloud',  // default
  timeout: 30_000,                        // 30s default
  retry: {
    maxRetries: 3,                        // default
    backoffMs: 500,                       // initial backoff, doubles each retry
  },
})
```

The API key determines whether requests go to live or test mode. Keys prefixed with `ck_test_` hit the test environment; `ck_live_` keys hit production.

## Error Handling

Every error extends `ConjoinError`, so you can catch broadly or narrow down to specific cases.

```ts
import {
  ConjoinAuthenticationError,
  ConjoinRateLimitError,
  ConjoinValidationError,
  ConjoinNetworkError,
  ConjoinTimeoutError,
} from '@conjoin-cloud/sdk'

try {
  await customers.create('entity_123', data)
} catch (err) {
  if (err instanceof ConjoinValidationError) {
    // err.errors contains field-level details
    for (const field of err.errors) {
      console.log(`${field.path}: ${field.message}`)
    }
  }

  if (err instanceof ConjoinRateLimitError) {
    // err.retryAfter tells you how long to wait (in seconds)
  }

  if (err instanceof ConjoinAuthenticationError) {
    // invalid or expired API key
  }

  if (err instanceof ConjoinNetworkError) {
    // DNS failure, connection refused, etc.
  }

  if (err instanceof ConjoinTimeoutError) {
    // request exceeded the configured timeout
  }
}
```

| Error Class | Status | When |
| ----------- | ------ | ---- |
| `ConjoinAuthenticationError` | 401 | Invalid or missing API key |
| `ConjoinValidationError` | 400, 422 | Request body or parameters failed validation |
| `ConjoinRateLimitError` | 429 | Too many requests; check `retryAfter` |
| `ConjoinNetworkError` | - | Connection failed, DNS resolution failed |
| `ConjoinTimeoutError` | - | Request exceeded the configured timeout |
| `ConjoinError` | any | Base class for all other API errors |

The SDK retries automatically on 429 and 5xx responses (up to `maxRetries` with exponential backoff). Authentication and validation errors are never retried.

## Requirements

- **Node.js** 20 or later
- **TypeScript** 5.x (for type-only consumers, the SDK ships compiled JS + `.d.ts` files)
- **React** 18+ (only if using `@conjoin-cloud/sdk/react`)
- **TanStack Query** 5+ (only if using `@conjoin-cloud/sdk/react`)

## Bundle Size

The SDK is designed for tree-shaking at every level:

- Each product is its own entry point. Importing `@conjoin-cloud/sdk/billing` pulls in zero code from auth, storage, or any other product.
- Factory functions (not classes) allow bundlers to eliminate unused methods.
- `"sideEffects": false` tells bundlers every module is safe to drop if unused.
- Both ESM and CJS outputs are provided.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions and guidelines.

## License

[MIT](./LICENSE)
