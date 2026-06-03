# @conjoin-cloud/react

`@conjoin-cloud/react` gives you batteries-included React bindings for [Conjoin](https://conjoin.delalify.com). You get the headless provider and hooks from `@conjoin-cloud/react-core` plus prebuilt UI components that render with Radix primitives. Import this package when you want components you can drop in; import `@conjoin-cloud/react-core` directly when you bring your own UI.

The package ships ESM and CJS builds. Import the root for the provider, hooks, and components. Import the stylesheet once to apply the component styles.

[![npm version](https://img.shields.io/npm/v/@conjoin-cloud/react)](https://www.npmjs.com/package/@conjoin-cloud/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

## Install

Install the package with your package manager:

```bash
npm install @conjoin-cloud/react
pnpm add @conjoin-cloud/react
yarn add @conjoin-cloud/react
```

Install `react` and `react-dom` `>=18.0.0` as peer dependencies.

## Quick Start

```tsx
import { ConjoinProvider, useAccount, useAuth } from '@conjoin-cloud/react'
import '@conjoin-cloud/react/styles.css'

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

`ConjoinProvider` accepts `publishableKey`, `config`, and `appearance`. The hooks include `useAuth`, `useSession`, `useAccount`, `useOrg`, `useEntitlements`, `useCheckout`, `useBundles`, `useChannel`, `useStorageUpload`, `useConjoinStatus`, and `useConjoinTheme`.

## Components

Import `<SignIn>`, `<SignUp>`, `<AccountButton>`, `<AccountProfile>`, `<OrgSwitcher>`, and `<PricingTable>` from the root. Each component reads its state from the provider, so wrap your tree with `<ConjoinProvider>` first. The component stylesheet is the only package side effect, so import `@conjoin-cloud/react/styles.css` once at your app root.

All component rules ship inside a single `conjoin` CSS cascade layer. You decide how your own styles rank against the defaults by declaring the layer order yourself. Put `@layer conjoin, app;` at the top of your global stylesheet and any rules you place in your `app` layer win over Conjoin's defaults, regardless of selector specificity.

## License

This package uses the [MIT](../../LICENSE) license.
