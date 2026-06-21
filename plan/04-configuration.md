# 04 — Configuration (`blume.config.ts`)

Configuration is **optional**. A folder of MDX renders with sane defaults. When
you want to set site identity, navigation, theming, or integrations, you add a
`blume.config.ts` at the project root.

## Shape

```ts
import { defineConfig } from "blume";

export default defineConfig({
  // ── Identity ─────────────────────────────────────────────
  name: "Acme Docs",
  description: "Everything you need to build with Acme.",
  url: "https://docs.acme.com",          // canonical base URL (SEO, sitemap, OG)
  logo: {
    light: "/logo-light.svg",            // shown in light mode
    dark: "/logo-dark.svg",              // shown in dark mode
    href: "/",                           // where the logo links (default "/")
    alt: "Acme",                         // accessible label
    // text: "Acme"                      // optional wordmark fallback / alongside
  },
  favicon: "/favicon.ico",

  // ── Theme ────────────────────────────────────────────────
  theme: {
    colors: { primary: "#6d28d9" },      // single accent; derives a scale
    defaultMode: "system",               // default "system" (resolved 09-AD)
    modeToggle: true,                    // show the light/dark toggle
    radius: "md",
    font: { sans: "Geist", mono: "Geist Mono" },  // defaults (09-AD), self-hosted

    // Code blocks / syntax highlighting (Shiki) — dual theme
    code: {
      themes: { light: "min-light", dark: "min-dark" },  // minimal default (09-AD)
      lineNumbers: false,                // default; per-block override in MDX
      copyButton: true,
      langs: [],                         // extra languages to preload
    },
  },

  // ── Announcement banner (renders the `Banner` slot) ──────
  banner: {
    content: "Blume 1.0 is here →",      // string or MDX
    dismissible: true,
    id: "v1-launch",                     // remembers dismissal by id
  },

  // ── Sidebar & TOC ────────────────────────────────────────
  sidebar: { expand: "multi", persist: true },   // default (09-AD)
  toc: { enabled: true, minDepth: 2, maxDepth: 3 },

  // ── Feedback widget ("Was this helpful?") (09-AJ) ────────
  feedback: {
    enabled: true,
    comment: true,                        // allow an optional comment
    webhook: "https://...",               // optional; default = analytics events
  },

  // ── Navigation ───────────────────────────────────────────
  // Omit to auto-derive from the filesystem + meta.json (recommended).
  // Provide to take explicit control. See 06-navigation.md.
  navigation: {
    tabs: [
      { label: "Docs", path: "/" },
      { label: "API", path: "/api" },
    ],
  },

  // ── Top navbar ───────────────────────────────────────────
  navbar: {
    links: [{ label: "Blog", href: "https://acme.com/blog" }],
    cta: { label: "Dashboard", href: "https://app.acme.com" },
    github: "acme/acme",                  // shows a GitHub link/star count
  },

  // ── Footer / social ──────────────────────────────────────
  footer: { text: "© Acme, Inc." },
  social: { x: "acme", github: "acme", discord: "https://discord.gg/..." },

  // ── Search ───────────────────────────────────────────────
  search: { provider: "pagefind" },       // default Pagefind + adapters (09-G)

  // ── SEO ──────────────────────────────────────────────────
  seo: {
    titleTemplate: "%s · Acme Docs",
    openGraph: { image: "/og.png" },
    sitemap: true,
    robots: true,
    structuredData: true,                 // auto JSON-LD: Article/Breadcrumb/Org (09-AK)
  },

  // ── Content ──────────────────────────────────────────────
  contentDir: ".",                        // default: project root (resolved 09-C)
  variables: {                            // {{ var }} substitution in MDX (09-AA)
    version: "2.4.0",
    productName: "Acme",
  },

  // ── Content collections + feeds (see 15-content-types.md) ─
  collections: {                          // root docs collection is implicit
    blog: { type: "blog", path: "blog", schema: blogSchema },   // optional Zod (09-AG)
    // changelog from your own files (default)…
    changelog: { type: "changelog", path: "changelog" },
    // …or auto-generate from GitHub Releases, opt out anytime (09-AM):
    // changelog: { type: "changelog", path: "changelog",
    //              source: { type: "github", repo: "acme/acme" } },
  },
  feeds: { rss: true, atom: true, limit: 50 },

  // ── Git metadata (resolved 09-AB) ────────────────────────
  git: {
    lastUpdated: true,                    // show "last updated" from git history
    contributors: true,                   // contributor avatars from git history
    editUrl: "https://github.com/acme/docs/edit/main/{path}",
  },

  // ── MDX extensibility ────────────────────────────────────
  mdx: {
    remarkPlugins: [],
    rehypePlugins: [],
  },

  // ── Redirects ────────────────────────────────────────────
  redirects: [{ from: "/old", to: "/new", permanent: true }],

  // ── Integrations ─────────────────────────────────────────
  integrations: {
    // built-in providers (plausible | ga4 | vercel | posthog) + custom (09-AH)
    analytics: { provider: "plausible", domain: "docs.acme.com" },
    // or: analytics: { provider: "custom", script: "<script ...></script>" },
  },

  // ── AI-native (see 11-ai.md) ─────────────────────────────
  ai: {
    llmsTxt: true,                        // /llms.txt + /llms-full.txt  (static)
    rawMarkdown: true,                    // per-page .md endpoints      (static)
    copyMarkdown: true,                   // "Copy as Markdown" action   (static)
    openInLLM: ["chatgpt", "claude"],     // per-page deep links         (static)
    askAI: {                              // opt-in; server-only (09-Z)
      enabled: false,
      provider: "anthropic",              // key read from server env, never client
    },
  },

  // ── Build & deploy (see 19-deployment.md) ────────────────
  output: "auto",                         // "auto" | "static" | "server" (09-B2)
                                          // auto: static when possible, else Node
  basePath: "",                           // deploy under a subpath, e.g. "/docs"
  trailingSlash: false,                   // clean URLs by default
});
```

The four static AI features default **on**; `askAI` is opt-in and **server-only**
(09-Z), so enabling it flips `output` to `server`. Landing/home pages are opted into
per-page via frontmatter (`layout: "landing"`), not global config — see
[03](./03-content-pipeline.md).

## The config is the home for surface-level customization

**Rule of thumb:** if a knob is something a non-developer would expect to set —
logo, favicon, accent color, default light/dark mode, **Shiki code themes**, fonts,
the announcement banner, nav, footer, social, SEO, analytics, AI features, git
metadata — it lives in `blume.config.ts`. You should never have to touch
`components.tsx` or `theme.css` for these. Those are the *next* rungs, for deeper
control.

Config-surface map (each links to its detail):

| Area | Keys |
| --- | --- |
| Identity | `name`, `description`, `url`, `logo`, `favicon` |
| Theme | `theme.colors.primary`, `theme.defaultMode`, `theme.modeToggle`, `theme.radius`, `theme.font` |
| Code | `theme.code.themes.{light,dark}`, `theme.code.lineNumbers`, `theme.code.copyButton`, `theme.code.langs` |
| Chrome | `banner`, `navbar`, `footer`, `social`, `sidebar`, `toc`, `feedback` |
| Content | `contentDir`, `variables`, `mdx`, `redirects` |
| Collections | `collections`, `feeds` (blog/changelog, schemas — [15](./15-content-types.md)) |
| Nav | `navigation` (or derive from filesystem + `meta.json`) |
| Discoverability | `search`, `seo` |
| AI | `ai` (see [11](./11-ai.md)) |
| Git | `git` (see [06](./06-navigation.md)) |
| Integrations | `integrations` |
| Build | `output`, `basePath`, `trailingSlash` ([19](./19-deployment.md)) |

## Principles for the config schema

- **Everything optional.** No required fields. Missing identity falls back to
  directory name and generated defaults.
- **`defineConfig` is identity + types.** It exists purely to give editor
  autocomplete and validation; it does not transform at author time.
- **Validated with Zod (or similar).** Friendly errors with the offending path,
  surfaced through `blume doctor` and dev startup.
- **Theming here is the "no-React" path.** Simple sites theme entirely via
  `theme` + `theme.css`. Deeper control graduates to `components.tsx`
  ([05](./05-customization.md)).
- **Config vs. convention.** Anything you can express in config you can also
  express via the filesystem (`meta.json`, frontmatter). Config wins on conflict,
  and explicit `navigation` overrides auto-derivation.

## Loading

`blume.config.ts` is TypeScript; it's loaded outside Next via a TS-aware loader
(`jiti`/`bundle-require`) so the content layer can read it before the runtime app
exists, and is also aliased into `.blume/` for the runtime.

## Open schema questions

Tracked in [09-open-questions.md](./09-open-questions.md):
- Single accent color with a derived scale vs. a full token object.
- Whether `navigation` lives in config, `meta.json`, or both (and precedence).
- Icon set (Lucide? custom registry? string names vs. components).
- i18n / versioning config shape (deferred but should not paint us into a corner).
