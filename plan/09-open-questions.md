# 09 — Open Questions & Decisions

Living list of decisions to settle. Each has options and a current leaning. None
are final. Resolve top-to-bottom roughly by how much they constrain everything
else.

## A. Runtime model — ✅ RESOLVED: generate a real `.blume/` app
`blume dev`/`build` generate an inspectable, gitignored Next.js app into the
project. Simplest module resolution, debuggable, and makes `blume eject` a clean
hand-off. Accepted cost: a generated directory to manage (disposable; rebuilt on
demand).
**Impact:** foundational — [01](./01-architecture.md), build, eject.

## B. MDX compile strategy — ✅ RESOLVED: build-time bundle
Compile/bundle MDX into the app at build (Contentlayer / fumadocs-mdx style) for
fast request-time rendering and static-export compatibility. Reinforced by the
auto-static output decision below (a static page can't compile MDX per request).
**Impact:** [03](./03-content-pipeline.md), performance, output modes.

## B2. Build output / hosting — ✅ RESOLVED: auto (static when possible)
`blume build` auto-detects features: pure **static export** (any CDN, zero infra)
when nothing needs a server, **Node standalone** when server features are present.
`config.output` can force `static` | `server`. Default `auto`.
**Impact:** [01](./01-architecture.md), [02](./02-cli.md), [04](./04-configuration.md).

## C. Content root default — ✅ RESOLVED: project root
Default content root is the **project root** (maximally zero-config), overridable
via `contentDir`. Ignore rules (dotfiles, `node_modules`, `.blume`, `_`-prefixed)
carry the weight of keeping config out of the route set.
**Impact:** [03](./03-content-pipeline.md), `init` templates, DX.

## D. Override namespacing — ✅ RESOLVED: grouped object
`defineComponents({ mdx: {...}, layout: {...} })`. Self-documents the
markdown-vs-chrome split and avoids edge-case key ambiguity. Maps to two internal
registries (`mdxComponents`, `layoutComponents`).
**Impact:** [05](./05-customization.md) — the headline API.

## E. Server vs. client overrides ergonomics — ✅ RESOLVED: require `"use client"`
RSC-first runtime. Interactive overrides must be client components; if an override
uses hooks/browser APIs without `"use client"`, Blume surfaces a precise, friendly
error pointing at the file (and a `blume doctor` check). Honest, standard React
mental model; no auto-wrap magic.
**Impact:** [05](./05-customization.md), [01](./01-architecture.md).

## F. Styling tech for the default theme — ✅ RESOLVED: Tailwind v4 internally
Default theme uses **Tailwind v4** internally. **Hard constraint:** user
`components.tsx` overrides require **no** Tailwind — tokens via CSS variables +
stable class hooks (`data-*` / `.blume-*`); users may bring any styling approach.
Blume's Tailwind setup must not leak into the user's project.
**Impact:** [07](./07-theming.md).

## G. Search provider — ✅ RESOLVED: Pagefind + adapter seam
Default search is **Pagefind** (static, zero-infra, indexes the built output —
works on static hosts), behind a **pluggable adapter** interface so Algolia/Orama/
others can be swapped in via `config.search.provider`.
**Impact:** [03](./03-content-pipeline.md), [06](./06-navigation.md), [07].

## H. Navigation source of truth & precedence — ✅ RESOLVED: all three
Ship all three in v0 with precedence **`config.navigation` > `meta.json` >
filesystem**. Filesystem auto-derives the tree (zero-config), `meta.json` refines
per folder (order/labels/groups/icons), explicit config can override.
**Impact:** [06](./06-navigation.md), [04](./04-configuration.md).

## I. Icon set — ✅ RESOLVED: Lucide by name + any React node
Default icon set is **Lucide**, referenced by string in frontmatter/`meta.json`/
config (`icon: "rocket"`). A React component/node is also accepted wherever an
icon is taken, for custom/brand icons. The `Icon` component resolves strings →
Lucide and is overridable. Lucide icons tree-shake.
**Impact:** [04](./04-configuration.md), [06](./06-navigation.md), [10](./10-components.md).

## J. CLI surface & release cut — ✅ RESOLVED
**First public release = deployable docs (through M7), AI fast-follow.** Commands
in that release: `dev`, `build`, `start`, `init`, `add`, `migrate`. `eject`/
`doctor`/`info` follow in M8; M0 skeleton needs only `dev`. Default `blume init`
scaffolds a **small showcase-y starter** (landing + a few doc pages + commented
config/components).
**Impact:** [02](./02-cli.md), [08](./08-roadmap.md).

## K. Config file loader — leaning `jiti` (spec in [12](./12-internals.md))
`jiti` for loading `blume.config.ts` / `components.tsx` outside Next (zero-config
TS/ESM, widely used); `bundle-require` is the fallback if `components.tsx` JSX/ESM
interop needs esbuild. Final pick during M3. Implementation detail.
**Impact:** [01](./01-architecture.md), [04](./04-configuration.md), [12](./12-internals.md).

## L. Theme color input — ✅ RESOLVED: single accent, derived scale
Config takes a single `theme.colors.primary`; Blume derives the scale and maps
shadcn's variables. Full per-token control is the `theme.css` rung (2), not config.
Keeps the common case one line and consistent with the 3-rung model.
**Impact:** [04](./04-configuration.md), [07](./07-theming.md).

## M. Project / package naming — ✅ RESOLVED: `blume` is ours
The npm name **`blume` is owned by us** (currently a `0.0.0` placeholder), so the
core CLI package publishes as **`blume`** with `bin: { blume }`. Supporting
packages use the `@blume/*` scope (e.g. `@blume/mdx`, `@blume/components`,
`@blume/registry`, `@blume/theme`) — confirm the scope/org is secured, else fall
back to `blume-*` unscoped.
**Impact:** [01](./01-architecture.md), publishing.

## N. Eject contract — direction set (spec in [12](./12-internals.md) §6)
`blume eject` copies `.blume/` and inlines the `@blume/app` glue into the project,
swapping aliases for real paths. Keeping the generated files thin (12 §4) makes
this clean. Exact supportability promise TBD; ships in M8.
**Impact:** [02](./02-cli.md), [01](./01-architecture.md), [12](./12-internals.md).

## O. Versioning & i18n — ✅ RESOLVED: post-1.0, design the seam now
Out of v1. But the manifest/nav schema must leave room for a **version/locale
dimension** now so we don't retrofit painfully later. Build the features post-1.0.
**Impact:** [06](./06-navigation.md), manifest schema, [08](./08-roadmap.md).

## T. AI-native features — ✅ RESOLVED: first-class
Ship `llms.txt`/`llms-full.txt`, per-page raw `.md`, copy-as-markdown, and
open-in-ChatGPT/Claude (all static, default-on), plus an opt-in **Ask AI** built on
the AI SDK with **bring-your-own provider/key** (no hosted inference). Full design
in [11-ai.md](./11-ai.md).
**Impact:** [11](./11-ai.md), [04](./04-configuration.md), [08](./08-roadmap.md), build output.

## U. Landing/home page — ✅ RESOLVED: optional, first-class
Support a polished full-bleed **landing/home page** opted into per-page via
frontmatter (`layout: "landing"`), with `Hero`/`FeatureGrid`/`CTA` primitives. Not
a general marketing-site system (vision non-goal stands otherwise).
**Impact:** [00](./00-vision.md), [03](./03-content-pipeline.md), [10](./10-components.md).

## V. Default theme aesthetic & technique — ✅ RESOLVED: docs.x.ai via override layer
Default theme targets the **docs.x.ai** look (minimal, high-contrast, monochrome,
sharp, dark-first). Applied as a **className/CSS override layer over pristine
shadcn** (targeting shadcn v4 `data-slot` selectors + tokens) — shadcn source is
never forked, so it stays upgradeable and `blume add` yields clean source.
**Impact:** [07](./07-theming.md), [10](./10-components.md), [05](./05-customization.md).

## W. License — ✅ RESOLVED: MIT
Blume is **MIT** licensed — permissive, ubiquitous in the JS ecosystem, lowest
friction for adoption and contribution.
**Impact:** [00](./00-vision.md), publishing.

## X. Dev toolchain — ✅ RESOLVED (spec in [13](./13-tooling.md))
Blume's own monorepo: **Turborepo** orchestration; **tsgo**
(`@typescript/native-preview`) for `typecheck`; **tsgo + `bun build`** for `build`;
**ultracite** (oxlint + oxfmt) for lint/format — *already configured in the repo*.
Turborepo owns build/typecheck (per-package, cached); ultracite owns lint/format
(repo-wide). Package manager is **bun** (bun workspaces); bun also bundles via
`bun build`.
**Impact:** [01](./01-architecture.md), [08](./08-roadmap.md), [13](./13-tooling.md).

## P. shadcn/ui delivery — ✅ RESOLVED: override + `blume add` registry
**Both.** Most customization happens in `components.tsx` (no copying). For deep
edits, Blume publishes a **shadcn-compatible registry** so `blume add <component>`
copies editable source into the user's project. shadcn's CSS-variable contract is
the token base. Coherent with the eject story (a Blume component *is* a
shadcn-style component you can take with you).
**Impact:** [01](./01-architecture.md), [02](./02-cli.md), [05](./05-customization.md), [07](./07-theming.md), [10](./10-components.md).

## Q. API-reference scope — ✅ RESOLVED: components now, OpenAPI later
v1 ships the **components** (`ParamField`, `ResponseField`, `TypeTable`,
`AutoTypeTable`, `RequestExample`/`ResponseExample`, `Panel`). Full **OpenAPI-spec
ingestion** → auto-generated reference is **post-1.0**.
**Impact:** [03](./03-content-pipeline.md), [10](./10-components.md), [08](./08-roadmap.md).

## R. Component prop API — ✅ RESOLVED: own API + codemods
Blume designs its **own** clean, consistent prop API (exact contracts spec'd in
[16-component-api.md](./16-component-api.md)), and ships `blume migrate
mintlify|fumadocs` codemods to rewrite existing docs. Clean mental model **and**
low-friction migration.
**Impact:** [02](./02-cli.md), [10](./10-components.md), [16](./16-component-api.md), migration/GTM.

## S. Heavy markdown features — ✅ RESOLVED: all on, tree-shaken
Math/LaTeX (KaTeX), Mermaid, and Twoslash are **on by default**. Pages that don't
use a feature pay ~0 for it via tree-shaking / per-page feature detection (only
load KaTeX where math appears, Mermaid where a diagram appears, etc.).
**Impact:** [03](./03-content-pipeline.md), bundle size, perf.

## Y. Extensibility — ✅ RESOLVED: hooks now, plugin API later
v1 extensibility = remark/rehype plugins + component overrides + `blume add` +
`config.integrations`. A **formal plugin API** (route/nav/component/data hooks) is
**post-1.0**, once real patterns emerge. Architecture keeps the hook points open.
**Impact:** [01](./01-architecture.md), [05](./05-customization.md).

## Z. Ask AI security — ✅ RESOLVED: server-only
Ask AI is **always server-proxied** — the provider key lives in server env and is
never exposed to the browser. Enabling it requires `output: "server"`. Static sites
keep all other AI features (llms.txt, raw `.md`, copy, open-in-LLM).
**Impact:** [11](./11-ai.md), [04](./04-configuration.md), build output.

## AA. Content reuse — ✅ RESOLVED: snippets + variables in v1
Ship `_`-prefixed reusable **snippets** (`<Snippet>`), `{{ variable }}` substitution
from `config.variables`, and per-folder **frontmatter defaults**. `blume doctor`
validates unknown variables / missing snippets.
**Impact:** [03](./03-content-pipeline.md), [04](./04-configuration.md), [10](./10-components.md).

## AB. Git-derived page metadata — ✅ RESOLVED: last-updated + edit + contributors
Build-time from git history: **last updated**, **Edit on GitHub** link
(`config.git.editUrl`), and **contributor** avatars. Degrades when not in a git
checkout. Surfaced via `PageMeta` / `EditOnGithub` slots.
**Impact:** [04](./04-configuration.md), [06](./06-navigation.md).

## AC. Quality, process & constraints — ✅ RESOLVED (see [14](./14-quality.md))
Committed: **vitest** units + generate-and-snapshot integration + **Playwright**
e2e + visual-regression; **WCAG 2.2 AA** with axe in CI; **changesets** + synced
`blume`/`@blume/*` releases + npm provenance. Acknowledged constraints (static-export
images, build perf at scale, MDX trust model, host-level private docs) tracked in 14.
**Impact:** [13](./13-tooling.md), [14](./14-quality.md), all packages.

## AE. Custom (non-MDX) pages — ✅ RESOLVED: `.tsx` pages become routes
A `.tsx`/`.jsx` file in the content tree becomes a route (default export = the
page), with access to Blume context/config/nav and an exported `meta.layout`
(`doc`/`landing`/`none`). The escape hatch for bespoke/interactive pages; client
components mark `"use client"`. Spec in [15](./15-content-types.md).
**Impact:** [03](./03-content-pipeline.md), [15](./15-content-types.md), [12](./12-internals.md).

## AF. Blog/changelog collections + feeds — ✅ RESOLVED: first-class
Named content collections (`type: doc|blog|changelog`) with auto list/detail pages,
dated ordering, tag/author pages (blog), overridable templates, and **RSS/Atom**
(opt. JSON) feeds at build. Root docs is the implicit collection.
**Impact:** [15](./15-content-types.md), [04](./04-configuration.md), [10](./10-components.md), [08](./08-roadmap.md).

## AG. Typed frontmatter — ✅ RESOLVED: opt-in Zod schemas
Optional per-collection **Zod** schema validates frontmatter + yields types
(Astro-style). Built-in fields always present; schema is additive; no schema = loose
default. Errors via `blume doctor`/overlay.
**Impact:** [15](./15-content-types.md), [03](./03-content-pipeline.md).

## AH. Analytics — ✅ RESOLVED: built-in providers + custom script
First-class config for `plausible | ga4 | vercel | posthog`, plus a `custom`
script escape hatch.
**Impact:** [04](./04-configuration.md), [12](./12-internals.md).

## AJ. Feedback widget — ✅ RESOLVED: yes, in v1
Per-page "Was this helpful?" (yes/no + optional comment), static-friendly via
analytics events with an optional webhook. `config.feedback`; `Feedback` slot.
**Impact:** [04](./04-configuration.md), [06](./06-navigation.md), [12](./12-internals.md).

## AK. Structured data (JSON-LD) — ✅ RESOLVED: auto-emit in v1
Auto-generate JSON-LD per page — `Article`/`TechArticle`, `BreadcrumbList`, and
`Organization` (from config). `config.seo.structuredData` (default on).
**Impact:** [04](./04-configuration.md), SEO, [08](./08-roadmap.md).

## AL. Live/runnable code playgrounds — ✅ RESOLVED: post-1.0
v1 ships excellent static code (Shiki, Twoslash, copy, `DynamicCodeBlock`).
Interactive Sandpack-style playgrounds are **post-1.0** (heavy, non-core).
**Impact:** [10](./10-components.md), [08](./08-roadmap.md).

## AM. Changelog source — ✅ RESOLVED: GitHub Releases or files
A changelog (or any) collection can auto-generate from **GitHub Releases** at build
(`source: { type: "github", repo }`) — tag/name/date/body mapped to entries — or use
your own MD/MDX files (`source: { type: "files" }`, default). Opt out anytime; local
files can also augment generated entries. Closes the loop with changesets →
GitHub Releases → docs changelog ([14](./14-quality.md)).
**Impact:** [15](./15-content-types.md), [04](./04-configuration.md), [12](./12-internals.md), [14](./14-quality.md).

## AD. Default theme values — ✅ RESOLVED
Out-of-the-box defaults (all overridable via `config.theme`): **mode = system**;
**fonts = Geist Sans + Geist Mono**; **code = minimal Shiki `min-light`/`min-dark`**
(near-mono, docs.x.ai-matching; bespoke theme may replace later); **sidebar =
multi-expand + persisted**. Also: the **root config is the home for all
surface-level customization** (logo, Shiki themes, fonts, banner, toc, …) — never
`components.tsx`/`theme.css` for those.
**Impact:** [04](./04-configuration.md), [06](./06-navigation.md), [07](./07-theming.md), [12](./12-internals.md).

---

### Resolved so far
- **A** — runtime model = generate a real `.blume/` app.
- **B** — MDX compile = build-time bundle.
- **B2** — build output = auto (static when possible, else Node standalone).
- **C** — content root = project root.
- **D** — override API = grouped `{ mdx, layout }` object.
- **E** — client overrides = require `"use client"` + friendly errors.
- **F** — default theme styling = Tailwind v4 internally (never imposed on users).
- **G** — search = Pagefind + pluggable adapter.
- **H** — navigation = all three; config > meta.json > filesystem.
- **I** — icons = Lucide by name + any React node.
- **J** — release cut = deployable docs (M7), AI fast-follow; showcase starter.
- **L** — theme color input = single accent, derived scale.
- **M** — naming = `blume` (owned) for the CLI; `@blume/*` for sub-packages.
- **O** — versioning & i18n = post-1.0; design the manifest/nav seam now.
- **P** — shadcn delivery = override-first + `blume add` registry.
- **Q** — API reference = components in v1, OpenAPI post-1.0.
- **R** — prop API = Blume's own + `blume migrate` codemods.
- **S** — heavy markdown features = all on, tree-shaken.
- **T** — AI features = first-class (static set on; Ask AI opt-in).
- **U** — landing/home page = optional, first-class (`layout: "landing"`).
- **V** — default theme = docs.x.ai look via className/CSS layer over pristine shadcn.
- **W** — license = MIT.
- **X** — dev toolchain = Turborepo + bun (workspaces + `bun build`) + tsgo + ultracite.
- **Y** — extensibility = hooks now (remark/rehype + overrides + integrations), plugin API later.
- **Z** — Ask AI = server-only (key never in browser; requires server output).
- **AA** — content reuse = snippets + `{{variables}}` + frontmatter defaults in v1.
- **AB** — git metadata = last-updated + edit link + contributors in v1.
- **AC** — quality/process = vitest + Playwright + visual-reg; WCAG 2.2 AA; changesets.
- **AD** — default theme = system mode; Geist fonts; minimal Shiki; multi-expand sidebar.
- **AE** — custom pages = `.tsx`/`.jsx` files become routes (escape hatch).
- **AF** — blog/changelog = first-class dated collections + RSS/Atom feeds.
- **AG** — frontmatter = opt-in Zod schemas (content collections).
- **AH** — analytics = built-in providers (plausible/ga4/vercel/posthog) + custom script.
- **AJ** — feedback widget = "Was this helpful?" in v1 (static via analytics + webhook).
- **AK** — structured data = auto JSON-LD (Article/Breadcrumb/Org) in v1.
- **AL** — live code playgrounds = post-1.0 (v1 = static Shiki/Twoslash).
- **AM** — changelog source = GitHub Releases (auto) or your own files (opt-out).

### Remaining open
- **K** — config-file loader (jiti vs bundle-require) — implementation detail.
- **N** — eject contract specifics (designable later; `.blume/` stays eject-clean).

Only one implementation detail (**K**) and one later-design item (**N**) remain.
The product shape, scope, and direction are fully settled.
