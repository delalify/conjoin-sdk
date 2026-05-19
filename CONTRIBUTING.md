# Contributing to Conjoin SDK

Thank you for your interest in contributing to the Conjoin SDK. This guide will help you get set up and familiar with the project structure so you can start contributing.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. Report unacceptable behavior to conjoin@delalify.com.

## Prerequisites

- **Node.js** 20 or later
- **pnpm** 10.x (installed via corepack: `corepack enable`)
- **Python** 3.10 or later
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

3. Install Python SDK development dependencies if you are working on Python:

```bash
cd sdks/python
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -e ".[dev]"
cd ../..
```

4. Generate SDK code from the OpenAPI spec:

```bash
pnpm nx run sdk-typescript:generate
pnpm nx run sdk-python:generate
```

5. Build the SDK you changed:

```bash
pnpm nx run sdk-typescript:build
pnpm nx run sdk-python:build
```

6. Run the tests for the SDK you changed:

```bash
pnpm nx run sdk-typescript:test
pnpm nx run sdk-python:test
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
    python/
      src/conjoin_cloud/
        _client.py          # Hand-written sync client
        _async_client.py    # Hand-written async client
        _transport.py       # Hand-written httpx transport
        generated/          # Auto-generated REST resources and models
      codegen/              # Python code generation pipeline
      scripts/run_python.py # Nx target runner that selects the Python environment
```

### Generated vs. Hand-written Code

The SDK uses a two-layer approach:

- **TypeScript `sdks/typescript/src/generated/`** contains auto-generated code from the OpenAPI spec. Never edit files in this directory by hand.
- **Python `sdks/python/src/conjoin_cloud/generated/`** contains auto-generated code from the OpenAPI spec. Never edit files in this directory by hand.
- Generated files are committed and drift-checked in tests so reviewers can see API surface changes.
- Hand-written SDK code owns client configuration, transports, errors, helpers, and product-level extensions that should not be generated.

## Development Workflow

### Common Commands

| Command | Description |
| ------- | ----------- |
| `pnpm nx run sdk-typescript:generate` | Generate TypeScript types and modules from OpenAPI spec |
| `pnpm nx run sdk-typescript:build` | Build the TypeScript SDK |
| `pnpm nx run sdk-typescript:test` | Run the TypeScript test suite |
| `pnpm nx run sdk-typescript:lint` | Check TypeScript code with Biome |
| `pnpm nx run sdk-typescript:format` | Auto-fix TypeScript lint and format issues |
| `pnpm nx run sdk-python:generate` | Generate Python resources and models from OpenAPI spec |
| `pnpm nx run sdk-python:build` | Build the Python wheel and sdist |
| `pnpm nx run sdk-python:test` | Run the Python test suite |
| `pnpm nx run sdk-python:typecheck` | Type-check Python with Pyright |
| `pnpm nx run sdk-python:lint` | Check Python code with Ruff |
| `pnpm nx run sdk-python:format` | Format Python code with Ruff |

The root `package.json` exists to provide the Nx command anchor for the workspace. It does not make `pnpm` the Python package manager. Python targets call `sdks/python/scripts/run_python.py`, which prefers `CONJOIN_PYTHON`, then `sdks/python/.venv`, then an active `VIRTUAL_ENV`, then the current interpreter.

### Running Everything

```bash
pnpm nx run-many -t lint typecheck test build
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

- **Biome** handles TypeScript formatting and linting.
- **Ruff** handles Python formatting and linting.
- TypeScript uses single quotes, no semicolons unless required for disambiguation, and a 120-character line width.
- TypeScript public entrypoints use factory functions, named exports, and no default exports.
- No top-level side effects in SDK modules.
- Generated product modules should depend only on shared SDK internals and generated types, not on each other.
- Python public APIs should be Pythonic: `snake_case` names, sync and async clients, typed request bodies, Pydantic response models, and explicit resource scopes where required.

### Writing Tests

- TypeScript tests live under `sdks/typescript/tests/` and use Vitest.
- Python tests live under `sdks/python/tests/` and use Pytest.
- Code generation tests should verify generated output stays current with `spec/openapi.json`.

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
