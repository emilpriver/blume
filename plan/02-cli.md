# 02 — CLI

The `blume` CLI is the only interface most users touch. It's a Node binary
distributed on npm, runnable via `npx blume@latest` or installed as a dev
dependency.

## Commands

### `blume dev`
Start the development server. Generates `.blume/`, builds the manifest, runs
`next dev`, and watches the project for changes.

```
blume dev [--port <n>] [--host <addr>] [--open] [--content <dir>] [--config <path>]
```

- `--port` (default `3000`)
- `--host` (default `localhost`)
- `--open` — open the browser
- `--content` — content directory override
- `--config` — path to `blume.config.ts`

### `blume build`
Production build. Generates `.blume/`, runs `next build`. Chooses output mode
(static export vs. standalone server) based on detected features, overridable in
config.

```
blume build [--content <dir>] [--config <path>] [--output static|server]
```

### `blume start`
Serve the production build (standalone server output).

```
blume start [--port <n>] [--host <addr>]
```

### `blume init`
Scaffold a new Blume project with a **small but showcase-y starter** (resolved
09-J/starter): a landing home page (`layout: "landing"`), a couple of doc pages
exercising callouts/tabs/code, a minimal `blume.config.ts`, a commented
`components.tsx`, a `.gitignore` (with `.blume/`), and `package.json` wiring. Teaches
the value by example without bloat. Backed by `create-blume`.

```
blume init [dir] [--template <name>] [--pm npm|pnpm|yarn|bun]
```

`npm create blume@latest` is the canonical entry point; `blume init` is the same
flow for users who already have the CLI. A single default template ships first;
`--template` leaves room for more later.

### `blume add`
Copy a default component's source into the user's project for deep customization,
via Blume's **shadcn-compatible registry** (resolved 09-P). The copied component
becomes editable, shadcn-style source the user owns; Blume wires it into the `mdx`
or `layout` registry automatically.

```
blume add <component...>     # e.g. blume add callout card tabs
blume add --list             # browse available components
```

Backed by `blume-registry` ([01-architecture.md](./01-architecture.md)); compatible
with the shadcn CLI's registry format, so `npx shadcn add` can also consume it.

### `blume migrate`
Run codemods to convert existing docs from another tool to Blume's component/prop
API (resolved 09-R). See [10-components.md](./10-components.md).

```
blume migrate mintlify [--dry-run]
blume migrate fumadocs [--dry-run]
```

Handles component renames, prop renames, and admonition-syntax differences where
mechanical; flags anything that needs a human.

### `blume eject`
Materialize `.blume/` into a real, owned Next.js app and detach from the managed
runtime. One-way door. This is the escape hatch that guarantees no lock-in.

```
blume eject [--dir <dir>]
```

> Ejection is a v1+ feature but is a first-class design constraint from day one —
> the generated app must be clean enough to hand over. See [09-open-questions.md](./09-open-questions.md).

### `blume doctor`
Diagnostics: Node/Next versions, config validity, broken links, orphaned files,
duplicate routes, missing frontmatter, client/server override mismatches.

### `blume info`
Print resolved configuration, content root, route count, and versions. Useful for
bug reports.

## Global flags

- `--verbose` / `-v` — debug logging
- `--cwd <dir>` — run as if in a different directory
- `--no-color`
- `--version`, `--help`

## Behavior notes

- **First run** generates `.blume/` and installs/links the runtime. Subsequent
  runs reuse and reconcile it.
- **`.blume/` is disposable.** Deleting it is always safe; `blume dev` rebuilds it.
- **Watch granularity:**
  - MDX content change → Next HMR, no manifest rebuild needed for body edits.
  - Frontmatter / new / moved / deleted files → manifest rebuild (fast).
  - `blume.config.ts` / `components.tsx` / `theme.css` → regenerate registry/config;
    restart the Next process only if required.
- **Errors** surface in a Blume-branded overlay (wrapping Next's) with the
  offending file path and a content-author-friendly message — not a webpack stack.
  Full categories, severity model, codes, and overlay anatomy in
  [18-errors.md](./18-errors.md).

## Implementation

- Arg parsing: a small library (`cac` or `commander`) — low priority which.
- The CLI orchestrates the library packages; it holds no rendering logic itself.
- Telemetry: **off by default**, opt-in only, clearly disclosed. (OSS trust.)

> **RESOLVED (09-J):** the **first public release** (through M7) ships `dev`,
> `build`, `start`, `init`, plus `add` (registry) and `migrate` (codemods) from
> M5.5. `eject`, `doctor`, `info` follow in M8. The earliest dev skeleton (M0) only
> needs `dev`.
