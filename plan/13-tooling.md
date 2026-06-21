# 13 — Project Tooling & Scripts

This doc is about developing **Blume itself** (the monorepo's build/typecheck/lint
toolchain) — not the end-user docs framework. End-user commands are
[02-cli.md](./02-cli.md).

## Already in the repo (as of now)

- Root `package.json` is **ESM** (`"type": "module"`).
- **ultracite** is configured for lint + format (resolved tooling, already done):
  - `oxlint.config.ts` → ultracite presets `core`, `react`, `next`, `vitest`.
  - `oxfmt.config.ts` → ultracite preset.
  - Root scripts: `check` → `ultracite check`, `fix` → `ultracite fix`.
- Package manager: **bun** (resolved 09-X). The repo currently has a
  `package-lock.json` from an initial npm install; it gets replaced by `bun.lock`
  (`bun install`) when the monorepo lands.
- `plan/` and `node_modules` are gitignored.

Turborepo, tsgo, and bun's workspace setup are **not yet installed** — they land
when M0 scaffolds the monorepo.

## The toolchain (resolved 09-X)

| Concern | Tool | Command |
| --- | --- | --- |
| Monorepo orchestration | **Turborepo** | `turbo run <task>` |
| Typecheck | **tsgo** (`@typescript/native-preview`) | `tsgo --noEmit` |
| Build | **tsgo** (`.d.ts`) + **`bun build`** (JS) | per package |
| Lint | **oxlint** via **ultracite** | `ultracite check` |
| Format | **oxfmt** via **ultracite** | `ultracite check` / `fix` |

## Monorepo structure & package manager

- **Turborepo** orchestrates over workspaces; packages per
  [01-architecture.md](./01-architecture.md) (`blume`, `@blume/app`, `@blume/mdx`,
  `@blume/components`, `@blume/registry`, `@blume/theme`, `create-blume`).
- **Package manager: bun** (bun workspaces) — one runtime for installs *and*
  builds. Workspaces are declared in the root `package.json` `workspaces` field;
  internal deps use the `workspace:*` protocol. `bun install` manages `bun.lock`
  (committed). The same bun also bundles via `bun build`, so a single tool covers
  install + bundling. Turborepo orchestrates on top.
- **Package tasks over root tasks** (Turborepo best practice): `build` and
  `typecheck` live in each package's `package.json`; the root only delegates via
  `turbo run`. This is what lets Turborepo parallelize and cache.

## `turbo.json`

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],          // build deps first
      "outputs": ["dist/**"]            // cache the emitted output
    },
    // Transit node: lets typecheck run in PARALLEL while still invalidating
    // cache when a dependency's source changes (it reads deps' types, not their
    // build output). See the Turborepo "transit nodes" pattern.
    "transit": { "dependsOn": ["^transit"] },
    "typecheck": { "dependsOn": ["transit"] },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Why lint/format are not Turborepo tasks:** oxlint/oxfmt (via ultracite) are
single-pass, whole-repo tools that are already extremely fast. Running
`ultracite check`/`fix` once at the root is simpler and faster than fragmenting
config into per-package `lint` tasks. So the split is: **Turborepo owns
build/typecheck** (per-package, cached); **ultracite owns lint/format**
(repo-wide, root).

## Scripts

### Root `package.json` (delegates only)
```jsonc
{
  "type": "module",
  "scripts": {
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "dev": "turbo run dev",
    "check": "ultracite check",         // existing — lint + format check
    "fix": "ultracite fix"              // existing — autofix + format
  },
  "devDependencies": {
    "turbo": "latest",
    "@typescript/native-preview": "latest",  // provides `tsgo`
    "oxfmt": "^0.55.0",                 // existing
    "oxlint": "^1.70.0",                // existing
    "ultracite": "^7.8.3"               // existing
  }
}
```

### A package (e.g. `packages/blume/package.json`)
```jsonc
{
  "scripts": {
    // bun bundles the JS (deps kept external); tsgo emits declarations
    "build": "bun build ./src/index.ts --outdir dist --target node --packages external && tsgo --emitDeclarationOnly",
    "typecheck": "tsgo --noEmit"
  }
}
```

> **tsgo note:** `tsgo` is the native (Go) TypeScript compiler preview, shipped as
> `@typescript/native-preview`. Typecheck (`--noEmit`) is solid; `.d.ts` emit is
> newer — if declaration emit isn't ready for a given package, fall back to `tsc
> --emitDeclarationOnly` for types while keeping `bun build` for JS and `tsgo` for
> the `typecheck` task. Revisit as tsgo matures.

## `.gitignore` additions (when packages land)

Append alongside the existing `plan` / `node_modules`:
```
.turbo
dist
.next
.blume
```
Note: **commit `bun.lock`**; remove the old `package-lock.json` on migration to bun.

## CI (later, M7+)

- `turbo run build typecheck --affected` — build/check only changed packages +
  dependents.
- `ultracite check` — lint/format gate (repo-wide, fast).
- Optional Turborepo **remote cache** for fast CI.
- See [08-roadmap.md](./08-roadmap.md) (CI lands around M7).
