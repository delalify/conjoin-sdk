# Contributing to Conjoin SDK

Thank you for your interest in contributing to the Conjoin SDK. This guide will help you get set up and familiar with the project structure so you can start contributing.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. Report unacceptable behavior to conjoin@delalify.com.

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 10.x (installed via corepack: `corepack enable`)
- **Git**

## Getting Started

1. Fork the repository and clone your fork:

```bash
git clone https://github.com/<your-username>/conjoin-sdk.git
cd conjoin-sdk
```

2. Install dependencies:

```bash
pnpm install
```

3. Generate types from the OpenAPI spec:

```bash
pnpm nx run sdk-typescript:generate
```

4. Build the SDK:

```bash
pnpm nx run sdk-typescript:build
```

5. Run the tests:

```bash
pnpm nx run sdk-typescript:test
```

## Project Structure

```
conjoin-sdk/
  spec/
    openapi.json            # OpenAPI spec (source of truth for all SDKs)
    scripts/validate.sh     # Spec validation
  sdks/
    typescript/
      src/
        core/               # Hand-written: client, fetch wrapper, errors, types
        auth/               # Product module (generated + hand-written extensions)
        billing/            # Product module
        ...                 # Other product modules
        generated/          # Auto-generated code (do not edit by hand)
        react/              # Hand-written: React hooks and components
        server/             # Hand-written: server utilities
      codegen/              # Code generation scripts
```

### Generated vs. Hand-written Code

The SDK uses a two-layer approach:

- **`src/generated/`** contains auto-generated code from the OpenAPI spec. These files are gitignored and rebuilt from the spec. Never edit files in this directory by hand.
- **`src/core/`**, **`src/react/`**, **`src/server/`**, and product module index files are hand-written. These files import from `generated/` and add custom logic where needed.

## Development Workflow

### Common Commands

| Command | Description |
| ------- | ----------- |
| `pnpm nx run sdk-typescript:generate` | Generate types and modules from OpenAPI spec |
| `pnpm nx run sdk-typescript:build` | Build the TypeScript SDK |
| `pnpm nx run sdk-typescript:test` | Run the test suite |
| `pnpm nx run sdk-typescript:lint` | Check code with Biome |
| `pnpm nx run sdk-typescript:format` | Auto-fix lint and format issues |

### Running Everything

```bash
pnpm nx run-many -t lint test build
```

### Task Dependencies

The Nx pipeline enforces this order:

```
spec:validate -> generate -> build -> test
```

You don't need to remember this; Nx handles it automatically when you run `build` or `test`.

## Making Changes

### Branching

- Create a branch from `main` for your work
- Use descriptive branch names: `fix/retry-backoff`, `feat/storage-upload-progress`, `docs/react-hooks`

### Code Style

- **Biome** handles formatting and linting. Run `pnpm nx run sdk-typescript:format` before committing.
- Single quotes, no semicolons (unless required for disambiguation), 120-character line width for JS/TS.
- Factory functions over classes (required for tree-shaking).
- Named exports only, no default exports.
- No top-level side effects in any module.
- Product modules import only from `core/` and `generated/`, never from each other.

### Writing Tests

- Tests live alongside source code in `__tests__/` directories.
- Use `vitest` with `vi.mock()` for mocking fetch calls.
- Test files follow the naming convention `{module}.test.ts`.

### Commit Messages

Write clear commit messages that explain the "why" behind a change. Use a short summary line (under 72 characters) followed by a blank line and any additional context if needed.

Prefix your summary with the area of change:

- `core: add timeout configuration validation`
- `billing: fix cursor serialization for list endpoints`
- `react: add useStorageUpload hook`
- `ci: update Node.js matrix to include v22`
- `docs: add React hooks usage examples`

## Pull Requests

1. Make sure all checks pass locally (`lint`, `test`, `build`).
2. Open a pull request against `main`.
3. Fill in the PR template with a summary of your changes and a test plan.
4. PRs require at least one review before merging.

### What Makes a Good PR

- Focused on a single change. Split unrelated changes into separate PRs.
- Includes tests for new functionality or bug fixes.
- Passes all CI checks.
- Has a clear description of what changed and why.

## Reporting Issues

- Use [GitHub Issues](https://github.com/conjoin-dev/conjoin-sdk/issues) to report bugs or request features.
- Include reproduction steps, expected behavior, and actual behavior for bug reports.
- Check existing issues before opening a new one.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
