# 18 — Error Handling & Dev Overlay UX

Blume's audience is **content authors**, not framework engineers. Errors must read
like editorial feedback — "this file, this line, here's the fix" — never a webpack
stack trace. This doc specs how every error surfaces.

## Principles

1. **Located.** Every error names the **source file** and, where possible, line +
   column with a **code frame**. The file path is the first thing you see.
2. **Actionable.** State the fix, not just the failure ("did you forget
   `\"use client\"`?", "unknown component `<Calout>` — did you mean `<Callout>`?").
3. **Author-friendly language.** Plain English; no bundler/React internals leaking.
4. **Branded overlay.** Dev errors render in a Blume overlay that *wraps* Next's, so
   the experience is consistent and on-theme.
5. **Stable error codes.** Each error has a code (e.g. `BLUME_MDX_001`) linking to a
   docs page — searchable, supportable.
6. **Dev forgiving, build strict.** Dev shows an overlay and hot-recovers on save;
   build fails fast with a **summary of all** errors and their locations.

## Severity model

| Severity | Dev | Build |
| --- | --- | --- |
| **error** | blocks the page; overlay | fails the build (after collecting all) |
| **warning** | non-blocking; overlay badge + console | configurable: warn (default) or error |
| **info** | console / `blume doctor` only | `blume doctor` only |

`blume doctor` ([02-cli.md](./02-cli.md)) is the aggregate, non-interactive checker
that reports every category below at once.

## Error categories

| Category | When | Dev | Build |
| --- | --- | --- | --- |
| MDX compile | syntax / unknown component | overlay (error) | fail + location |
| Config invalid | `blume.config.ts` fails Zod / TS | overlay (error) | fail + field path |
| Frontmatter schema | collection Zod validation fails | overlay (error) | fail + file/field |
| Broken internal link | link resolves to no route | warning | warn (default) / error |
| Client/server override | hooks without `"use client"` (09-E) | overlay (error) | fail + file |
| Missing snippet / unknown var | `<Snippet>` / `{{var}}` (09-AA) | warning | warn / error |
| Duplicate / ambiguous route | two files → same URL | overlay (error) | fail + both files |
| Missing asset | image/file ref not found | warning | warn / error |
| Runtime render | error thrown in a component/page | error boundary | n/a (caught at runtime) |

## The dev overlay (anatomy)

```
┌──────────────────────────────────────────────────────────────┐
│  ⬤ Blume — MDX error                            BLUME_MDX_001 │
│  content/guides/setup.mdx:14:3                                 │
│                                                                │
│  12 │ <Steps>                                                  │
│  13 │   <Step title="Install">                                 │
│  14 │     <Calout type="tip">run `blume dev`</Calout>          │
│     │      ^^^^^^ Unknown component "Calout"                   │
│                                                                │
│  Did you mean <Callout>?  ·  Components reference → /docs/...   │
└──────────────────────────────────────────────────────────────┘
```

- **Header:** product mark, category, stable error code (links to docs).
- **Location:** clickable `file:line:col` (terminal + editor protocols).
- **Code frame:** the offending lines with a caret.
- **Message + fix hint:** plain-language cause and the suggested correction.
- Multiple errors stack; warnings show a dismissible badge that doesn't block.

The same content prints to the terminal (dev server) in a compact form, and is what
`blume doctor` aggregates.

## Per-category detail

- **MDX compile** — from the MDX/remark pipeline ([03](./03-content-pipeline.md)).
  Unknown components are matched against the registry; suggest the nearest name
  (Levenshtein). Frontmatter parse errors point at the YAML line.
- **Config** — Zod errors render the **path** (`theme.colors.primary`) with
  expected vs received; TS load failures (via jiti) show the file + message.
- **Frontmatter schema** — per-collection Zod (09-AG): names the file and the field;
  for `required` violations, says which key is missing.
- **Broken links** — internal link resolution (03 §10) lists the source file, the
  bad target, and nearby valid routes. Default **warning** in dev/build; tighten via
  `config` to fail the build.
- **Client/server override** — when an override uses hooks/browser APIs without
  `"use client"` (resolved 09-E), the overlay names the file and the exact hook, and
  shows the one-line fix. Detected at build/compile, surfaced in dev.
- **Snippets / variables** — missing `<Snippet file>` target or an undefined
  `{{var}}` not in `config.variables` (09-AA): warning naming the file + token.
- **Duplicate routes** — both contributing files are shown (e.g. `guides.mdx` +
  `guides/index.mdx`).
- **Runtime render** — a React error in a custom `.tsx` page or override is caught
  by a branded **error boundary** with a friendly fallback; dev shows the wrapped
  Next overlay with the component stack trimmed to user code.

## Error code catalog

Codes are stable and grouped by area, each with a docs page:

| Prefix | Area |
| --- | --- |
| `BLUME_CONFIG_*` | configuration |
| `BLUME_MDX_*` | MDX / markdown |
| `BLUME_NAV_*` | navigation / `meta.json` |
| `BLUME_CONTENT_*` | collections / frontmatter schema |
| `BLUME_LINK_*` | links / assets |
| `BLUME_RENDER_*` | client/server / runtime |

## Recovery & DX

- **HMR:** fixing the file clears the overlay without a full reload where possible.
- **Partial render:** an error in one page doesn't take down the whole dev server;
  other routes keep working.
- **No telemetry** by default; error reporting stays local.
- `blume doctor --fix` can auto-resolve the mechanical ones (e.g. add a missing
  `meta.json` entry, normalize a link) where safe.
