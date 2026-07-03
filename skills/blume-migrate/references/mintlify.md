# Mintlify → Blume

The deepest migration. Mintlify declares its **entire navigation in `docs.json`**; Blume derives navigation from the filesystem. The bulk of the work is reshaping content into folders + tabs and translating config, callouts, and icons.

## Detect

- `docs.json` (current) or `mint.json` (legacy) at the repo root — the config file.
- A `mintlify` dependency / `mintlify dev` script.
- Content is `.mdx` under the repo root (Mintlify has no `content.root` — pages live at the top level), with a `/snippets` folder and image dirs like `/images`.

Read `docs.json` first; it drives everything.

## Config: `docs.json`/`mint.json` → `blume.config.ts`

Resolve `$ref` includes first (Mintlify splits config across files). Map only what's set:

| Mintlify | Blume | Notes |
| --- | --- | --- |
| `name` / `title` | `title` |  |
| `description` | `description` |  |
| `logo` (string or `{ light, dark, href }`) | `logo` | pass through; ensure files land in `public/` |
| `favicon` | **drop the field** — copy the file into `public/` under the conventional name (`favicon.svg`/`icon.png`) | Blume auto-detects by filename; there is **no** favicon config field |
| `colors.primary` | `theme.accent` |  |
| `colors.light` | `theme.accentDark` |  |
| `colors.dark` | `theme.action` |  |
| `appearance.default` | `theme.mode` (`light`/`dark`/`system`) |  |
| `appearance.strict` | `theme.strict` |  |
| `background.color.{light,dark}` | `theme.background` / `theme.backgroundDark` |  |
| `background.image` | `theme.backgroundImage` / `theme.backgroundImageDark` |  |
| `background.decoration` | **drop** | no Blume equivalent |
| `fonts.family` / `fonts.{heading,body}.family` | `theme.fonts.{display,body}` | only if the family is a curated Google-font slug (kebab-case, e.g. `space-grotesk`); otherwise drop and tell the user to add `@font-face` in `theme.css` |
| `banner` | `banner` (`{ content, dismissible, id, link }`) | **only** those keys — drop `banner.color`/`banner.type` |
| `styling.latex: true` | `markdown.math: true` |  |
| `styling.codeblocks.theme` | `markdown.codeBlocks.theme` (`{ light, dark }`) |  |
| `search.prompt` | **drop** | no equivalent |
| `seo.metatags` | **drop** | no equivalent; use per-page `seo` frontmatter |
| `seo.indexing: "all"` | `search.indexing.includeHiddenPages: true` |  |
| `variables` (`{{name}}`) | **inline into content** | Blume has no runtime `{{var}}` substitution — replace each `{{name}}` with its value in the pages |
| `redirects` | `redirects: [{ from, to }]` | static only — see below |
| `navigation.languages` | `i18n` | see i18n below |

A minimal result is often just `defineConfig({ title, logo, theme: { accent } })`.

## Icons: FontAwesome → Lucide (required)

Mintlify defaults to **FontAwesome**; Blume is **Lucide-only**. Convert every icon reference — frontmatter `icon`, nav-group `icon`, `<Icon>`, `<Card icon>` — to the closest Lucide name. Discard Mintlify's `iconType` (solid/regular/brands) entirely. Common mappings:

| FontAwesome | Lucide |  | FontAwesome | Lucide |
| --- | --- | --- | --- | --- |
| `bolt` | `zap` |  | `gear`/`cog` | `settings` |
| `circle-info`/`info` | `info` |  | `wand-magic-sparkles`/`magic` | `sparkles` |
| `house` | `house` |  | `magnifying-glass` | `search` |
| `gauge`/`gauge-high` | `gauge` |  | `puzzle-piece` | `puzzle` |
| `envelope` | `mail` |  | `file-lines` | `file-text` |
| `pen-to-square` | `square-pen` |  | `trash-can` | `trash-2` |
| `xmark`/`times` | `x` |  | `circle-check` | `circle-check` |
| `triangle-exclamation` | `triangle-alert` |  | `circle-exclamation` | `circle-alert` |
| `arrow-right-from-bracket` | `log-out` |  | `right-to-bracket` | `log-in` |
| `location-dot`/`map-marker` | `map-pin` |  | `comments` | `messages-square` |
| `cube` | `box` |  | `cubes`/`boxes` | `boxes` |
| `layer-group` | `layers` |  | `diagram-project`/`sitemap` | `workflow`/`network` |
| `chart-line` | `line-chart` |  | `chart-simple`/`chart-column` | `bar-chart` |
| `flask` | `flask-conical` |  | `robot` | `bot` |
| `screwdriver-wrench`/`toolbox` | `wrench` |  | `circle-question`/`question` | `circle-help` |
| `life-ring` | `life-buoy` |  | `shield-halved` | `shield` |
| `rocket`/`book`/`book-open`/`code`/`terminal`/`key`/`lock`/`user`/`users`/`database`/`server`/`cloud`/`bell`/`calendar`/`star`/`heart`/`tag`/`folder`/`globe`/`link`/`download`/`upload`/`check`/`copy`/`play`/`filter` | _(same name — verify)_ |

**Rules:** verify each Lucide name exists at [lucide.dev/icons](https://lucide.dev/icons) before writing it. **Brand icons** (`fa6-brands:*` — github, discord, x, slack, linkedin…) mostly have **no** Lucide equivalent: for GitHub use the `github` config (renders the header repo link); for other socials, drop the icon and report it (or add via a Footer override after `blume eject`). Where no Lucide counterpart exists, **drop the icon and report it** — an unknown icon name is a build error.

## Navigation: `docs.json` `navigation` → filesystem + tabs

Mintlify's `navigation` object (`tabs`/`anchors`/`dropdowns`/`products`/`versions`/`languages`/`groups`/`pages`) is fully config-declared. **Prefer restructuring content into folders**, not porting the config verbatim:

- **`groups`** (`{ group, pages: [...] }`) → a folder per group. The `group` name → the folder's humanized name or a `meta.ts` `title`. Nested groups → nested folders. `expanded: false` → `meta.ts` `collapsed: true` (inverted). `tag` → the folder/page `sidebar.badge`.
- **`pages`** entries are page refs (paths without extension) → files at the corresponding path. An entry that's `"GET /path"` is an OpenAPI endpoint stub → **delete it** (Blume generates these; see OpenAPI).
- **`tabs`** → `navigation.tabs` (`{ label, path, icon? }`). Put each tab's pages in **one folder** and point the tab's `path` at it — the tab then scopes the sidebar automatically.
- **`dropdowns`/`products`/`versions`** → `navigation.selectors` (`{ kind, label, items: [{ label, path, icon?, description?, tag? }] }`). Use `kind` `dropdown`/`product`/`version` accordingly.
- **`languages`** → `i18n`, not a selector (see below).
- Only fall back to an explicit `navigation.sidebar` for a shape the filesystem genuinely can't express.

## Content & component transforms

Rewrite each page's MDX:

- **Callouts → directives** (work in `.md` and `.mdx`): `<Note>`→`:::note`, `<Tip>`→`:::tip`, `<Warning>`→`:::warning`, `<Info>`→`:::info`, `<Check>`→`:::success`, `<Danger>`/`<Error>`→`:::danger`. `<Callout type="x">` maps by type (`caution`→warning, `check`→success). A `title` attr → `:::type[Title]`. Drop `icon`/color props.
- **Accordions — container/item inversion!** Mintlify nests `<Accordion title="…">` inside `<AccordionGroup>`. Blume inverts: `<AccordionGroup>`→`<Accordion>` (container), and each Mintlify `<Accordion title="…">`→`<AccordionItem title="…">` (item).
- **`<RequestExample>`/`<ResponseExample>`** → `<CodeGroup>` (titled-fence tabs).
- **These pass through — Blume ships them natively:** `<Columns>`/`<Column>`, `<Expandable>`, `<Tooltip>`, `<Frame>`, `<Panel>`, `<Card>`/`<CardGroup>`, `<Tabs>`/`<Tab>`, `<Steps>`/`<Step>`. Keep them as-is.
- **API fields → `TypeTable`.** Blume does **not** ship `<ParamField>`/`<ResponseField>`/`<RequestField>`. Convert a cluster of fields into one `<TypeTable>` (rows keyed by field name, each `{ type, required?, default?, description }`). For a fully spec'd API, prefer deleting the hand-written fields and using the [OpenAPI reference](#openapi) instead.
- **`<Update>`** (a Mintlify changelog entry) has no component form → convert to a `type: changelog` page, or use the `github-releases` source.
- **Snippets are inlined, not imported.** Blume has no `/snippets` import mechanism. For each `import X from "/snippets/x.mdx"` + `<X prop="v" />`, inline the snippet's body (substituting `{prop}` placeholders), then delete the import and the `/snippets` file. Named string imports (`import { foo } from "/snippets/vars.mdx"`) → inline the value at each `{foo}`.

## Frontmatter

Mintlify page frontmatter → Blume's strict schema:

| Mintlify | Blume |
| --- | --- |
| `title` / `description` | pass through |
| `sidebarTitle` | `sidebar.label` |
| `icon` | `sidebar.icon` (converted to Lucide) |
| `tag` | `sidebar.badge` |
| `hidden: true` | `sidebar.hidden: true` **and** `noindex: true` |
| `canonical` | `seo.canonical` |
| `og:image` | `seo.image` |
| `openapi`/`asyncapi`/`api` | `type: api` (but prefer deleting stub pages — Blume generates them) |
| `mode`, `public`, `rss`, `groups`, `keywords`, `hideApiMarker`, `hideFooterPagination` | **drop** (report) |

Remove any duplicate H1 in the body — `title` renders the H1.

## OpenAPI

Top-level `openapi`, `api.openapi`, or a per-group/per-tab `openapi` → `openapi: { enabled: true, sources: [{ spec, label?, route? }] }`. A Mintlify `{ source, directory }` object: `directory` → the source's `route`. **Delete every per-endpoint stub page** (frontmatter `openapi: "GET /path"` or a `"GET /path"` nav entry) — Blume's native renderer generates one real page per operation.

## Assets

Mintlify serves every top-level dir (e.g. `/images`) at the site root. Blume serves `public/` at the site root. **Move root asset dirs into `public/`** (`mv images public/images`) — every `/images/...` reference still resolves, unchanged. Move loose root files (`logo.png`, `favicon.png`) under `public/` too.

## i18n

`navigation.languages` (≥2) → `i18n: { defaultLocale, locales: [{ code, label }] }`. The `default: true` language → `defaultLocale`. Translated content already lives in ISO-code directories, which match Blume's `dir` parser — no file moves. Remove any language selector; language switching is handled by i18n.

## Dropped — report these

- **`navbar.links`/`navbar.primary`** (header CTAs) → re-add via `navigation.tabs` or a Header override.
- **`footer.socials`** → suggest the `github` config, or a Footer override.
- **Per-language banners** (`navigation.languages[].banner`) → no equivalent.
- **Dynamic redirects** (`:slug*`/`:id` params) → can't be static path-to-path; move to host rules (`_redirects`, `vercel.json`).
- **`<Update>`** changelog components, `iconType`, `background.decoration`, `search.prompt`, `seo.metatags`, non-curated fonts.
