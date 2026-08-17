# Contributing to Transferum

Thank you for your interest in contributing to Transferum! This document describes the process and conventions for contributing to the project.

## Project Overview

Transferum is a type-safe data transfer graph library for TypeScript. The codebase is zero-dependency at runtime, targets ES6, and maintains 100% test coverage. Before contributing, please read the [README](README.md) to understand the core concepts: transfers, bridges, builders, operators, capability flags, and linking strategies.

## Prerequisites

- **Node.js** 18+ (tested on 18–26 in CI)
- **npm** (installed via nvm or otherwise)
- TypeScript 6, Jest 30, ESLint 9 (all listed in `devDependencies` — `npm install` handles them)

## Setup

```bash
git clone https://github.com/Smoren/transferum-ts.git
cd transferum-ts
npm install
```

## Common Commands

| Command         | Description                                               |
|-----------------|-----------------------------------------------------------|
| `npm run build` | Build CommonJS (`lib/`) and ESM (`es/`) outputs via `tsc` |
| `npm run test`  | Run the full test suite with coverage (`jest --coverage`) |
| `npm run lint`  | Lint `src/` with ESLint                                   |
| `npm run docs`  | Generate API docs via TypeDoc into `docs/api`             |

## Code Standards

### TypeScript

- `strict: true` — no implicit `any`, no implicit `undefined`, strict null checks
- `isolatedModules: true` — each file must be independently compilable
- Target: ES6, module: Node16
- JSDoc with `@category` tags on all exported entities (TypeDoc groups by category)
- `@deprecated` tag on deprecated APIs with a pointer to the replacement

### ESLint

Flat config in `eslint.config.mts` (TypeScript-eslint recommended). Notable rule overrides:
- `@typescript-eslint/no-explicit-any`: off — `any` is used in three cases: (1) internal type-level machinery (`UnionToIntersection`, `ResolveFeatures`, `FilterNever`, tuple manipulations) where a precise type is inexpressible; (2) default type parameters of branded capability types (`Pushable<T = any>`, etc.), which act as compile-time flags and never degrade inference at factory call sites; (3) legacy deprecated composite builders/interfaces (`DuplexTransfer<unknown, any>`). Explicit `any` must not appear in the signatures of active (non-deprecated) public API. Long-term target: eliminate the override entirely as the type system evolves.
- `@typescript-eslint/no-empty-object-type`: off — **temporary** override, scoped to the deprecated code sections only (legacy composite types that use `{}` as a fallback in their conditional types). New code must not rely on it; the override should be removed together with the deprecated API in the next major release.

### EditorConfig

2 spaces, LF line endings, UTF-8, trim trailing whitespace, final newline. See `.editorconfig`.

### Testing

- **100% coverage** is required for all source files (statements, branches, functions, lines).
- Tests use Jest + ts-jest, `testEnvironment: node`.
- Test files mirror `src/` structure under `tests/` (e.g., `src/transfers.ts` → `tests/transfers/`). The mirroring is organized by module and may not be strictly 1:1 for files that do not contain runtime logic (e.g., `configs.ts`, `types.ts`).
- Use `jest.useFakeTimers()` for timer-dependent tests to keep them deterministic.
- Example/use-case tests in `tests/examples/` must stay in sync with README code samples.

## Pull Request Process

1. **Open an issue first** for new features or significant changes — discuss the approach before writing code.
2. **Fork the repository** and create a branch from `dev` (not `master`).
3. **Write code and tests** — every new code path must have test coverage.
4. **Run all checks locally** before submitting:
   ```bash
   npm run lint
   npm run build
   npm run test
   ```
5. **Update documentation** — if your change adds or modifies public API, update the README, JSDoc, and relevant test examples.
6. **Keep changes focused** — one PR per feature/fix; avoid unrelated refactoring in the same PR.
7. **Write clear commit messages** — describe what changed and why.

### What we look for in PRs

- Type safety: capability flags must be compile-time literals, not runtime values.
- Zero runtime dependencies.
- Minimal runtime complexity — complexity belongs in the type layer.
- Backward compatibility within the v1.x line (no breaking API changes).
- Consistent style with existing code.

## Reporting Bugs

Open a [GitHub issue](https://github.com/Smoren/transferum-ts/issues) with:
- Transferum version
- Node.js version
- Minimal reproduction (code snippet or test case)
- Expected vs actual behavior

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
