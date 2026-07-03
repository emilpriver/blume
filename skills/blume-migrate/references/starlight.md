# Starlight → Blume

Starlight is an Astro integration configured via `starlight({…})` in `astro.config.*`, with content in `src/content/docs`. Both are Astro, so this is a natural fit — content can stay in place.

## Detect

- `astro.config.{mjs,mts,ts,js,cjs}` importing and calling **`starlight({…})`** (`import starlight from "@astrojs/starlight"`).
- Content under **`src/content/docs/`**; a `src/content.config.ts`.
- `@astrojs/starlight` dep.

Keep content where it is — set `content.root: "src/content/docs"`.

## Config: `starlight({…})` → `blume.config.ts`

| Starlight option | Blume |
| --- | --- |
| `title` | `title` (if per-locale/computed, set manually) |
| `description` / `tagline` | `description` (tagline is the fallback) |
| `logo` (`{ src }` or `{ light, dark, alt }`) | `logo` — move the referenced file into `public/` |
| `logo.replacesTitle` | drop |
| `favicon` | copy the file into `public/` (drop the config field — Blume auto-detects) |
| `social` (`{ github: url }` or `[{ icon, href }]`) | derive **`github: { owner, repo }`** from the GitHub URL; other socials drop (report) |
| `editLink.baseUrl` (`…/edit/<branch>`) | `github: { owner, repo, branch }` (wins over `social.github` — carries the branch) |
| `sidebar` (array) | `navigation.sidebar` (see below) |
| `expressiveCode.themes: [dark, light]` | `markdown.codeBlocks.theme: { dark, light }` |
| `expressiveCode.styleOverrides` | drop → restyle via `theme.css` |
| `head` (`<meta name/property content>`) | `seo.metatags`; other `<head>` entries drop → custom layout |
| `lastUpdated: true` | `lastModified: true` |
| `customCss` | drop → move into a top-level `theme.css` |
| `components` (overrides) | drop → re-implement via `blume eject` |
| `plugins` / `routeMiddleware` | drop → no equivalent, manual review |
| `locales` / `defaultLocale` | `i18n` (see below) |

## Navigation: `sidebar`

Starlight's `sidebar` array → `navigation.sidebar`, **or** prefer letting Blume generate from the filesystem when the source just used `autogenerate` on directories:

- string `"guides/intro"` → `"/guides/intro"`.
- `{ label, autogenerate: { directory: "d" } }` → `{ label, root: "d" }` (or just structure the folder and rely on filesystem nav).
- `{ label, items: [...] }` → `{ label, items: [...] }` (recursive).
- `{ label?, link }` → `{ label, href: link }`.
- `{ label?, slug }` → `/<slug>`.
- `badge` (string or `{ text, variant }`) → `badge` (text only; variant drops). `collapsed` (bool) → `collapsed`.

## Frontmatter

| Starlight | Blume |
| --- | --- |
| `title` / `description` / `draft` / `slug` | pass through |
| `sidebar.{label,order,hidden}` | pass through |
| `sidebar.badge` | `sidebar.badge` (text only) |
| `pagefind: false` | `search.exclude: true` |
| `lastUpdated` (date/string) | `lastModified` |
| `prev: false` / `next: false` | `hideFooterPagination: true` |
| `template: splash` / `hero` | **no equivalent** — rebuild as a custom `.astro` page under `content.pages` |
| `banner`, `tableOfContents`, `editUrl`, `head` | drop (report) |
| custom `prev`/`next` labels | drop |

## Components

- **Asides → directives:** `<Aside type="note|tip|caution|danger">` → `:::note`/`:::tip`/`:::caution`/`:::danger` (Blume aliases `caution`→warning at render). Bare `<Aside>`→`:::note`. `title` → `:::type[Title]`.
- **Renames:** `<CardGrid>` → `<CardGroup>`; `<LinkCard>` → `<Card>` (its `description` prop drops — fold into the body); `<TabItem label="…">` → `<Tab title="…">`. `<Tabs>`, `<Card>`, `<Badge>` stay.
- **Convert yourself** (codemod left these): `<Steps>` → Blume `<Steps>`/`<Step>`; `<FileTree>` → Blume `<FileTree>`; `<Code code=…>` → a fenced code block; `<LinkButton>` → a Markdown link or `<Card>`.
- Strip `import … from "@astrojs/starlight/*"` lines.
- **Aliased asset paths** (`![](~/…)`, `src="@/…"`) → rewrite to a relative path or a `/public` URL.

## Icons

Starlight's built-in icon set is **not** Lucide. Convert every `<Icon name="…">` and any sidebar/frontmatter icon to the closest Lucide name; drop and report where none exists.

## i18n

`locales` + `defaultLocale` → `i18n: { defaultLocale, locales: [{ code, label }], hideDefaultLocalePrefix: true, parser: "dir" }`. Starlight's `root` locale → the un-prefixed default. Locale subdirectories under `src/content/docs` match Blume's `dir` parser — no file moves.

## Teardown

Remove `@astrojs/starlight` from deps, delete the now-unused `astro.config.*` Starlight bits and `src/content.config.ts`, repoint scripts to the Blume CLI, add `blume`.

## Dropped — report these

Non-GitHub socials, `logo.replacesTitle`, badge variants, `customCss`/component overrides/plugins/routeMiddleware, splash/hero pages (rebuild as custom pages), `<Icon>` name translation, aliased asset paths.
