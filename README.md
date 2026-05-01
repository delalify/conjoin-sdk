# Conjoin SDKs

Official SDKs for [Conjoin](https://conjoin.delalify.com) — auth, billing, storage, messaging, relay, AI, runtime, database, and cloud platform management. One package per language, tree-shakeable from top to bottom.

## Packages

| Language | Package | Source | Status |
|---|---|---|---|
| TypeScript / JavaScript | [`@conjoin-cloud/sdk`](https://www.npmjs.com/package/@conjoin-cloud/sdk) | [`sdks/typescript`](./sdks/typescript) | Available |
| Python | `conjoin-cloud` | `sdks/python` | Planned |
| Go | `github.com/delalify/conjoin-cloud-go` | `sdks/go` | Planned |
| PHP | `conjoin-cloud/sdk` | `sdks/php` | Planned |

For language-specific install, configuration, and API documentation, see each package's README.

## Repository layout

```
conjoin-sdk/
├── sdks/                  Per-language SDK packages
│   └── typescript/        @conjoin-cloud/sdk
├── spec/                  OpenAPI source-of-truth
└── .github/workflows/     CI and publish pipelines
```

The OpenAPI spec at `spec/openapi.json` is the source of truth. Each SDK's codegen reads it to produce typed bindings.

## Development

This repo is an Nx-managed pnpm monorepo.

```bash
pnpm install
pnpm nx run sdk-typescript:generate    # regenerate codegen from the spec
pnpm nx run sdk-typescript:typecheck   # tsc --noEmit
pnpm nx run sdk-typescript:lint        # biome check
pnpm nx run sdk-typescript:build       # tsup
pnpm nx run sdk-typescript:test        # vitest
```

Or from each package directory:

```bash
cd sdks/typescript
pnpm test
```

## Releasing

Releases are driven from GitHub Actions via the [Publish workflow](.github/workflows/publish.yml). Each SDK is versioned independently; tags follow `{projectName}@v{version}` (e.g. `sdk-typescript@v0.1.0`). The workflow runs lint, typecheck, build, and tests before any publish, supports dry runs, and emits signed npm provenance attestations.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup and guidelines.

## License

[MIT](./LICENSE)
