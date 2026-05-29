# @conjoin-cloud/react-core

`@conjoin-cloud/react-core` gives you headless React bindings for [Conjoin](https://conjoin.delalify.com). You get the auth and data hooks, a framework-agnostic provider primitive, and an SSR-safe web provider, theme, and transport. The package ships no UI components, so you bring your own.

The package ships ESM and CJS builds with two entry points. Import the root for the agnostic provider and hooks. Import `@conjoin-cloud/react-core/web` for the web provider, theme, and `useConjoinTheme`.

[![npm version](https://img.shields.io/npm/v/@conjoin-cloud/react-core)](https://www.npmjs.com/package/@conjoin-cloud/react-core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

## Install

Install the package with your package manager:

```bash
npm install @conjoin-cloud/react-core
pnpm add @conjoin-cloud/react-core
yarn add @conjoin-cloud/react-core
```

Install peer dependencies for the entry points you import:

- Install `react` `>=18.0.0` for the root entry.
- Install `react-dom` `>=18.0.0` when you import `@conjoin-cloud/react-core/web`.

## Entry Points

- Import `@conjoin-cloud/react-core` for `ConjoinProviderCore`, the auth and data hooks, `useConjoinClient`, `useAuthFetch`, and the shared provider types. This entry needs `react` only and touches no DOM, so it runs in any React renderer.
- Import `@conjoin-cloud/react-core/web` for `ConjoinProvider`, `useConjoinTheme`, and the `ConjoinThemeState` type. This entry is SSR-safe and reads the DOM only inside browser guards.

## Web Quick Start

```tsx
import { ConjoinProvider } from '@conjoin-cloud/react-core/web'
import { useAccount, useAuth } from '@conjoin-cloud/react-core'

function App() {
  return (
    <ConjoinProvider publishableKey="pk_live_...">
      <Profile />
    </ConjoinProvider>
  )
}

function Profile() {
  const { isLoaded, isSignedIn } = useAuth()
  const account = useAccount()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <a href="/sign-in">Sign in</a>
  }

  return <div>Hello, {account.account?.email}</div>
}
```

`ConjoinProvider` accepts `publishableKey`, `config`, `appearance`, and `cssLayerName`. The hooks include `useAuth`, `useSession`, `useAccount`, `useOrg`, `useEntitlements`, `useCheckout`, `useBundles`, `useChannel`, `useStorageUpload`, `useConjoinStatus`, and `useConjoinTheme`.

## Custom Transports

`ConjoinProviderCore` takes a `transport` prop, so you can run the provider in a renderer without DOM access. Pass an object that satisfies the `AuthTransport` type to control how tokens persist and how requests attach auth.

## License

This package uses the [MIT](../../LICENSE) license.
