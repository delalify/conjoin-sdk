# Conjoin SDKs

This repository contains the official SDK packages for Conjoin. Each SDK lives in its own package directory, follows the conventions of its language ecosystem, and generates typed API bindings from `spec/openapi.json`.

## SDK Catalog

| SDK | Package | Source | Guide |
| --- | --- | --- | --- |
| TypeScript and JavaScript | [`@conjoin-cloud/sdk`](https://www.npmjs.com/package/@conjoin-cloud/sdk) | [`sdks/typescript`](./sdks/typescript) | [`sdks/typescript/README.md`](./sdks/typescript/README.md) |
| Python | `conjoin-cloud` | [`sdks/python`](./sdks/python) | [`sdks/python/README.md`](./sdks/python/README.md) |

Each SDK guide covers installation, authentication, generated resources, errors, examples, and package-local development.

## Shared API Source

`spec/openapi.json` is the source schema for generated resources. SDK generators read the schema and produce language-specific clients, models, and request helpers. Hand-written helpers stay inside each SDK package when a language needs runtime-specific behavior.

## Repository Layout

- `sdks/` contains one package directory per SDK.
- `spec/` contains the OpenAPI schema and validation script.
- `.github/workflows/` contains CI and publish workflows.
- `package.json` and `nx.json` define the shared task graph.

## Development

Install the root tooling once:

```bash
pnpm install
```

Run all SDK targets through Nx from the repository root:

```bash
pnpm nx run-many -t generate
pnpm nx run-many -t typecheck
pnpm nx run-many -t lint
pnpm nx run-many -t build
pnpm nx run-many -t test
```

Run one SDK target by project name:

```bash
pnpm nx run sdk-typescript:test
pnpm nx run sdk-python:test
```

Some SDKs need package-local setup before root tasks can run. Read the SDK guide before working inside a package.

## Releases

The [Publish workflow](.github/workflows/publish.yml) publishes SDK packages. Nx versions packages independently and uses tags in the `{projectName}@v{version}` format, such as `sdk-typescript@v0.1.0`. The workflow runs generation, linting, type checks, builds, and tests before publishing.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and contribution guidelines.

## License

This repository uses the [MIT](./LICENSE) license.
