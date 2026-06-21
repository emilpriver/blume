# 01 — Architecture

## The core trick: a generated, hidden Next.js app

Blume's central illusion is that the user has no app — only content. In reality,
Blume materializes a Next.js (App Router) application and runs it. The user never
opens it, but it's there.

When the user runs `blume dev`, Blume:

1. **Reads the project** — discovers `content/**/*.{md,mdx}`, loads
   `blume.config.ts`, `components.tsx`, optional `theme.css`, and `public/`.
2. **Generates a runtime app** into a hidden `.blume/` directory (gitignored).
   This is a thin Next.js app whose pages, layout, and component registry are
   wired to the user's project via path aliases and a generated content manifest.
3. **Builds a content manifest** — maps every route to a source file plus its
   frontmatter, headings (TOC), and position in the navigation tree.
4. **Runs `next dev`** against `.blume/`.
5. **Watches** the user's project. Content edits flow through Next HMR; structural
   changes (new files, config, components) regenerate the manifest and, when
   necessary, restart.

```
.blume/                          # generated, gitignored
├── app/
│   ├── layout.tsx               # app shell: providers, navbar, sidebar, footer
│   └── [[...slug]]/page.tsx     # catch-all: slug -> MDX content
├── blume.manifest.json          # routes, nav tree, TOC, frontmatter
├── components.generated.ts      # merge(defaultComponents, userComponents)
├── next.config.mjs              # aliases to user project, MDX setup
└── tsconfig.json                # paths: @content, @blume/user-*
```

> **RESOLVED (09-A):** Blume generates a real `.blume/` app (over a prebuilt app
> fed by virtual modules) for simpler module resolution, debuggability, and a clean
> `blume eject`. The directory is disposable and rebuilt on demand.

## Why generate instead of ship-and-point?

Next.js App Router resolves routes and components from files on disk, and user
overrides (`components.tsx`) may import their own dependencies. Generating a real
app in the user's project root means:

- Node module resolution "just works" — user deps resolve from their own
  `node_modules`.
- The app is **inspectable** (great for debugging) and **ejectable** (the basis
  for `blume eject`).
- Path aliases (`@content`, `@blume/components`) keep generated code tiny — it
  mostly re-exports Blume's internals plus the user's files.

The trade-off is a generation step and a `.blume/` directory to manage. We accept
that; it's how Nextra/Contentlayer-style tools and many meta-frameworks operate.

## Layers

```
┌──────────────────────────────────────────────────────────────┐
│  CLI  (blume dev | build | start | init | eject)               │  02-cli
├──────────────────────────────────────────────────────────────┤
│  Project loader   — config, components, theme, env (jiti/      │
│                     bundle-require to load TS config files)     │  04, 05
├──────────────────────────────────────────────────────────────┤
│  Content source   — discovery, routing, frontmatter, TOC,      │
│                     nav tree, manifest                          │  03
├──────────────────────────────────────────────────────────────┤
│  MDX compiler     — remark/rehype, Shiki, built-in components   │  03
├──────────────────────────────────────────────────────────────┤
│  App generator    — writes .blume/ (pages, layout, registry)    │  this file
├──────────────────────────────────────────────────────────────┤
│  Runtime app      — Next.js: app shell + renderer + registry    │  05, 06, 07
├──────────────────────────────────────────────────────────────┤
│  Next.js (dev/build/start)                                      │
└──────────────────────────────────────────────────────────────┘
```

## Request lifecycle (rendering one page)

1. Request hits `app/[[...slug]]/page.tsx` (catch-all).
2. Slug is resolved against `blume.manifest.json` → source file + metadata.
3. The MDX for that file is rendered from its **build-time-bundled** module
   (resolved 09-B) — no per-request compilation, which keeps static export viable.
4. The renderer is handed the **merged component registry**: Blume defaults
   overlaid with the user's `components.tsx`. Markdown elements (`h1`, `code`, …)
   and built-in components (`Callout`, `Tabs`, …) resolve through it.
5. The layout (also overridable) wraps the page with navbar, sidebar, TOC, footer,
   reading the same manifest for navigation.

## Component registry & override merging

User overrides are authored as two buckets and merged into two registries:

- **`mdx`** — markdown/HTML primitives (`h1`–`h6`, `p`, `a`, `pre`, `code`,
  `img`, `table`, …) plus built-in MDX components (`Callout`, `Card`, `Tabs`, …).
  Fed to the MDX renderer.
- **`layout`** — app-shell slots (`Navbar`, `Sidebar`, `Toc`, `Footer`, `Logo`,
  `ThemeToggle`, `PageWrapper`, …). Fed to the layout.

`components.generated.ts` is literally:

```ts
import { defaultMdx, defaultLayout } from "blume/components";
import user from "@blume/user-components"; // user's components.tsx default export

export const mdxComponents    = { ...defaultMdx,    ...user.mdx };
export const layoutComponents = { ...defaultLayout, ...user.layout };
```

This is what makes "override anything" true: one file feeds both the markdown
renderer and the chrome. Details in [05-customization.md](./05-customization.md).

## RSC vs. client components

The runtime app uses React Server Components by default (static-first, minimal
JS). Default components are server components where possible; interactive ones
(theme toggle, search, tabs, mobile nav) are client components. **User overrides
that need interactivity must be client components** (`"use client"`). Per resolved
09-E, Blume does not auto-wrap: if an override uses hooks/browser APIs without
`"use client"`, it surfaces a precise, friendly error (and a `blume doctor` check)
pointing at the file — honest over magical.

## Extensibility & plugins (resolved 09-Y)

v1 extensibility rides on the seams that already exist:
- **Content/markdown:** user remark/rehype plugins via `config.mdx`.
- **UI:** component overrides (`components.tsx`) and the `blume add` registry.
- **Integrations:** `config.integrations` (analytics, etc.).

A **formal plugin API** (lifecycle hooks that can add routes, nav, components, and
data sources) is intentionally **deferred to post-1.0** — we want real extension
patterns to emerge before freezing that surface. The architecture keeps the door
open: the content source, manifest, and registry are the natural hook points a
future plugin system would target.

## Production build

`blume build`:
1. Same project load + app generation as dev.
2. `next build` against `.blume/`.
3. Output target depends on features used (auto, 09-B2):
   - **Fully static** (`output: "export"`) when nothing needs a server.
   - **Standalone Node server** when server features (e.g. Ask AI) are present.

`blume start` serves the built standalone output. Full output modes, env/secrets,
and platform presets are in [19-deployment.md](./19-deployment.md).

## Loading TypeScript config & component files

`blume.config.ts` and `components.tsx` are TypeScript and may use JSX/ESM. Blume
loads them outside Next via a TS-aware loader (`jiti` or `bundle-require`) so the
CLI/content layers can read config before the Next app exists. The same files are
also aliased into `.blume/` for the runtime to import directly.

## Blume's own repository layout

Blume itself is a **Turborepo** monorepo on **bun workspaces**. Toolchain: **tsgo**
(typecheck + `.d.ts`), **`bun build`** (JS bundling), **ultracite** (oxlint + oxfmt,
already configured). Full setup in [13-tooling.md](./13-tooling.md).

Published names follow resolved **09-M**: the CLI/core ships as **`blume`** (name
owned by us; `bin: { blume }`), supporting packages under the **`@blume/*`** scope,
and the scaffolder as **`create-blume`** (so `npm create blume` works).

```
blume/                          # monorepo (pnpm + Turborepo)
├── packages/
│   ├── blume/              → npm: blume          CLI + core (source, generator)
│   ├── app/               (→ @blume/app)         Next.js runtime template
│   ├── mdx/               (→ @blume/mdx)         remark/rehype + compile pipeline
│   ├── components/        (→ @blume/components)  defaults on shadcn/ui (Radix+TW4)
│   ├── registry/          (→ @blume/registry)   shadcn registry for `blume add`
│   ├── theme/             (→ @blume/theme)       default theme / tokens / CSS
│   └── create-blume/      → npm: create-blume    `npm create blume` scaffolder
├── examples/
│   └── starter/            # a sample docs project (also used for dev/dogfood)
├── docs/                   # Blume's own docs, built with Blume (dogfood)
└── plan/                   # this planning folder
```

> Package **names** are resolved (09-M); exact **boundaries** (e.g. whether
> `@blume/mdx` and `@blume/components` stay separate or fold into `blume`) can still
> shift. The split above optimizes for clear ownership and independent iteration.
> Confirm the `@blume` org/scope is secured (fallback: `blume-*` unscoped).
