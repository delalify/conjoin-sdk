# @conjoin-cloud/expo

`@conjoin-cloud/expo` gives you React Native bindings for [Conjoin](https://conjoin.delalify.com). You get a native `ConjoinProvider` that stores tokens in the device keychain through `expo-secure-store`, plus the auth and data hooks re-exported from the headless core. The package ships no DOM or web code, so it runs on iOS and Android.

[![npm version](https://img.shields.io/npm/v/@conjoin-cloud/expo)](https://www.npmjs.com/package/@conjoin-cloud/expo)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)

## Install

Install the package with your package manager:

```bash
npm install @conjoin-cloud/expo
pnpm add @conjoin-cloud/expo
yarn add @conjoin-cloud/expo
```

Install `react` `>=18.0.0` and `expo-secure-store` `>=13.0.2` in your app. The provider loads `expo-secure-store` on demand and throws a clear error when it is missing, so add it with `npx expo install expo-secure-store`.

## Quick Start

```tsx
import { ConjoinProvider, useAccount, useAuth } from '@conjoin-cloud/expo'
import { Text } from 'react-native'

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
    return <Text>Loading...</Text>
  }

  if (!isSignedIn) {
    return <Text>Sign in to continue</Text>
  }

  return <Text>Hello, {account.account?.email}</Text>
}
```

`ConjoinProvider` accepts `publishableKey` and `config`. The hooks include `useAuth`, `useSession`, `useAccount`, `useOrg`, `useEntitlements`, `useCheckout`, `useBundles`, `useChannel`, `useStorageUpload`, and `useConjoinStatus`.

## License

This package uses the [MIT](../../LICENSE) license.
