# Conjoin SDKs

Official SDKs for [Conjoin](https://conjoin.delalify.com) — auth, billing, storage, messaging, relay, AI, runtime, database, and cloud platform management. One package per language, tree-shakeable from top to bottom.

## Packages

| Language | Package | Source | Status |
|---|---|---|---|
| TypeScript / JavaScript | [`@conjoin-cloud/sdk`](https://www.npmjs.com/package/@conjoin-cloud/sdk) | [`sdks/typescript`](./sdks/typescript) | Available |
| Python | `conjoin-cloud` | [`sdks/python`](./sdks/python) | Active implementation |
| Go | `github.com/delalify/conjoin-cloud-go` | `sdks/go` | Planned |
| PHP | `conjoin-cloud/sdk` | `sdks/php` | Planned |

For language-specific install, configuration, and API documentation, see each package's README.

## Repository layout

```
conjoin-sdk/
├── sdks/                  Per-language SDK packages
│   ├── typescript/        @conjoin-cloud/sdk
│   └── python/            conjoin-cloud
├── spec/                  OpenAPI source-of-truth
└── .github/workflows/     CI and publish pipelines
```

The OpenAPI spec at `spec/openapi.json` is the source of truth. Each SDK's codegen reads it to produce typed bindings.

## Development

This repo uses Nx as the shared task graph and release coordinator. The root `package.json` is intentionally a thin JavaScript tooling anchor: `pnpm` installs the workspace JavaScript tooling and TypeScript package dependencies, while Nx dispatches each SDK target to that language's own tooling. Python dependencies stay in the Python environment under `sdks/python`.

```bash
pnpm install

# TypeScript SDK
pnpm nx run sdk-typescript:generate
pnpm nx run sdk-typescript:typecheck
pnpm nx run sdk-typescript:lint
pnpm nx run sdk-typescript:build
pnpm nx run sdk-typescript:test

# Python SDK
cd sdks/python
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -e ".[dev]"
cd ../..
pnpm nx run sdk-python:generate
pnpm nx run sdk-python:typecheck
pnpm nx run sdk-python:lint
pnpm nx run sdk-python:build
pnpm nx run sdk-python:test
```

Or from each package directory:

```bash
cd sdks/typescript
pnpm test

cd ../python
python3 -m pytest
```

## Releasing

Releases are driven from GitHub Actions via the [Publish workflow](.github/workflows/publish.yml). Each SDK is versioned independently; tags follow `{projectName}@v{version}` (e.g. `sdk-typescript@v0.1.0`). The workflow runs lint, typecheck, build, and tests before any publish, supports dry runs, and emits signed npm provenance attestations.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and guidelines.

## License

[MIT](./LICENSE)
