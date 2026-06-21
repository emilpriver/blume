# 08 — Roadmap

Milestones from skeleton to 1.0. Each is a thin vertical slice that stays
runnable. Order favors getting the "aha" loop working end-to-end early, then
deepening.

## M0 — Walking skeleton
**Goal:** `blume dev` renders one MDX file through a generated Next.js app.
- Monorepo scaffolding (**Turborepo**; add tsgo + bun + turbo on top of the
  existing ultracite setup), package boundaries from
  [01-architecture.md](./01-architecture.md). Toolchain: [13-tooling.md](./13-tooling.md).
- `blume` CLI with `dev` only.
- Generate `.blume/` with a catch-all route and a hardcoded layout.
- Compile + render a single MDX file. Default `h1`/`p`/`code`.
- **Exit criteria:** edit an MDX file, see it at localhost with HMR.

## M1 — Content pipeline
**Goal:** a folder of MDX becomes a routed site.
- Discovery, file→route mapping, `index.mdx` handling.
- Frontmatter parsing + fallbacks (title from H1/slug).
- Heading extraction → TOC; nav tree assembly.
- `blume.manifest.json` generation + watch/regeneration.
- **Exit criteria:** multi-page site with working routes and a nav tree.

## M2 — Default app shell & theme
**Goal:** it looks like real docs out of the box.
- **shadcn/ui + Tailwind v4 foundation**; adopt shadcn's CSS-variable contract.
- **docs.x.ai aesthetic** (resolved 09-V) applied as a className/CSS layer over
  pristine shadcn (`data-slot` selectors + tokens) — no forking shadcn source.
- Default values (09-AD): **Geist Sans + Geist Mono**, **system** default mode,
  **multi-expand persisted sidebar**.
- Navbar, sidebar (groups, active trail), right-rail TOC, footer.
- Dark mode (class-based, no-flash, toggle, **system default**), design tokens.
- Shiki syntax highlighting (dual-theme, **`min-light`/`min-dark`** default).
- Responsive + mobile nav.
- **Exit criteria:** the default theme is shippable as-is and reads like docs.x.ai.

## M3 — Configuration
**Goal:** `blume.config.ts` controls identity, nav, theme, SEO.
- `defineConfig` + Zod validation + friendly errors.
- TS config loading (jiti/bundle-require) wired into content layer + runtime.
- Theme tokens from config; `theme.css` support.
- SEO basics: titles, meta, sitemap, robots.
- Analytics integrations (plausible/ga4/vercel/posthog + custom — 09-AH).
- SEO structured data: auto JSON-LD (09-AK).
- **Exit criteria:** brand a site fully without writing components.

## M4 — Customization (the differentiator)
**Goal:** `components.tsx` overrides markdown + chrome.
- Component registry + merge; wire into renderer and layout.
- `defineComponents`, namespacing convention, `useBlume()` context.
- Export defaults for composition; client/server override guidance + errors.
- **Exit criteria:** override `h1` and `Navbar` from one file; defaults intact
  elsewhere.

## M5 — MDX standard library (Mintlify + Fumadocs parity)
**Goal:** rich content components, all overridable, all on shadcn/ui. See
[10-components.md](./10-components.md).
- Full catalogue: Callout family, Tabs, Steps, Accordion, Card/Cards/Columns,
  Frame, CodeGroup, Files tree, Expandable, Tooltip, Icon, Update, Banner.
- API-reference **components** (resolved 09-Q): TypeTable, AutoTypeTable,
  ParamField, ResponseField, Request/ResponseExample, Panel. (OpenAPI generation
  is post-1.0.)
- Callout shorthand (`> [!NOTE]`, `:::warning`), code titles/highlight/diff/copy.
- Heavy features on by default, **tree-shaken per page** (resolved 09-S):
  Math/KaTeX, Mermaid, Twoslash.
- Landing/home primitives (`Hero`, `FeatureGrid`, `CTA`) + `layout: "landing"`
  (resolved 09-U).
- Content reuse: snippets, `{{variables}}`, frontmatter defaults (09-AA).
- Git-derived page metadata: last-updated, edit link, contributors (09-AB).
- Content model ([15](./15-content-types.md)): custom `.tsx` page routes (09-AE);
  blog/changelog **collections** with templates + RSS/Atom feeds (09-AF); opt-in
  Zod frontmatter schemas (09-AG); changelog from **GitHub Releases** or files
  (09-AM).
- Feedback widget ("Was this helpful?" — 09-AJ).
- **Exit criteria:** author a feature-rich page (incl. math, a diagram, a type
  table, a snippet, a `{{variable}}`) with no imports; parity matrix in
  [10](./10-components.md) is green; a landing home page renders.

## M5.5 — Registry & migration
**Goal:** own-it customization and painless switching.
- **`blume add <component>`** — shadcn-compatible registry copies editable source
  into the project (resolved 09-P); `blume-registry` package.
- **`blume migrate mintlify|fumadocs`** — codemods to Blume's prop API
  (resolved 09-R).
- **Exit criteria:** `blume add callout` yields editable owned source; a sample
  Mintlify doc set migrates cleanly.

## M6 — Search
**Goal:** ⌘K search that works on static output.
- Index generation; **Pagefind** default (resolved 09-G) + adapter seam.
- Command-palette UI (`SearchButton`), keyboard nav, overridable.
- **Exit criteria:** search a built site with no external service.

## M7 — Build, export & deploy
**Goal:** ship it anywhere.
- `blume build` / `blume start`; auto static vs. standalone output (resolved 09-B2).
- Redirects, 404, robots/sitemap finalization; `basePath`/`trailingSlash`.
- Deploy guides + platform presets (Vercel/Netlify/Cloudflare/Node/static) per
  [19-deployment.md](./19-deployment.md); Vercel framework preset; Dockerfile.
- **Exit criteria:** deploy a static build and a server build successfully.

## M7.5 — AI-native surface (resolved 09-T)
**Goal:** docs are first-class LLM context. See [11-ai.md](./11-ai.md).
- **Static set (default-on):** `llms.txt` + `llms-full.txt`, per-page raw `.md`,
  copy-as-markdown, open-in-ChatGPT/Claude. Generated at build; zero infra.
- **Ask AI (opt-in, server-only — 09-Z):** AI SDK behind a server route (key in
  server env, never the browser); flips output to `server`. Grounded on the search
  index with cited sources.
- **Exit criteria:** a static build serves valid `llms.txt` + per-page `.md`; Ask AI
  (server mode) answers from the corpus with citations and never exposes the key.

## M8 — DX, escape hatches & dogfood
**Goal:** polish and trust.
- `blume init` / `create-blume` templates.
- `blume doctor` (broken links, dup routes, override mismatches), `blume info`.
- `blume eject` to a plain Next.js app.
- Branded error overlay.
- **Build Blume's own docs with Blume** (`/docs`) as the primary dogfood.
- **Exit criteria:** a newcomer goes from zero to deployed, customized docs
  without reading source.

## Post-1.0 (captured, not scheduled)
- **Full OpenAPI → API reference generation** (resolved 09-Q: components ship in
  v1, spec ingestion comes later).
- **Versioning + i18n/locales** (resolved 09-O: seam designed in v1, built after).
- **Docs as an MCP server** so agents query a Blume site natively ([11](./11-ai.md)).
- Ask AI server-proxy mode hardening; richer retrieval/eval tooling.
- OG image generation, more analytics integrations.
- Additional content sources (CMS/Notion → reference docs).
- Scoped/per-section overrides; slot-based component props.
- **Live/runnable code playgrounds** (Sandpack-style — 09-AL).
- Optional hosted/Cloud layer (preview deploys, analytics) — OSS stays the core.

## Release cut (resolved 09-J)
- **First public release = through M7** — deployable, beautiful, customizable,
  searchable docs. Commands: `dev`/`build`/`start`/`init`/`add`/`migrate`.
- **AI surface (M7.5) is a fast follow** — ships shortly after, not gating launch.
- **M8** (eject/doctor/info, dogfooded docs site) rounds out toward 1.0.
- License: **MIT** (09-W).

## Cross-cutting (every milestone — see [14-quality.md](./14-quality.md))
- **Testing** alongside each milestone: vitest units + generate-and-snapshot
  integration from M1, Playwright e2e from M2, visual-regression once the theme
  lands (M2).
- **Accessibility** (WCAG 2.2 AA + axe in CI) is a gate from M2 onward.
- **Release** (changesets, synced `blume`/`@blume/*`, provenance) wired by M7.

## Sequencing notes
- M0–M2 prove the architecture; M4 proves the thesis. Don't let M4 slip far —
  the override story is *why* Blume exists.
- Dogfooding (M8) should start informally as early as M2.
