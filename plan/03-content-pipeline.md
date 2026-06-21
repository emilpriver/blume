# 03 — Content Pipeline

The content pipeline turns a folder of MDX into a routed, navigable, searchable
site. It runs at dev startup (and on watch) and at build.

## 1. Discovery

- Glob `**/*.{md,mdx}` under the content root.
- **Content root (RESOLVED, was 09-C):** the **project root** by default —
  maximally zero-config (drop MDX next to nothing else and it just works).
  Configurable via `contentDir` for those who prefer a `content/`/`docs/` folder.
  Because docs sit alongside `blume.config.ts`/`package.json`/`.blume`, the ignore
  rules below (dotfiles, `node_modules`, `.blume`, `_`-prefixed) matter more.
- Ignore: `node_modules`, `.blume`, dotfiles, and files/folders prefixed with `_`
  (partials/includes).

## 2. Routing (file → URL)

| File | Route |
| --- | --- |
| `index.mdx` | `/` |
| `quickstart.mdx` | `/quickstart` |
| `guides/setup.mdx` | `/guides/setup` |
| `guides/index.mdx` | `/guides` |

- `.md` and `.mdx` both supported. `.tsx`/`.jsx` files become **custom React pages**
  and named **content collections** (blog/changelog) are also supported — see
  [15-content-types.md](./15-content-types.md).
- **Route groups** via parenthesized folders `(group)/...` that don't appear in
  the URL (mirrors Next conventions) — optional, later.
- A folder-level `meta.json` controls ordering, titles, and grouping for items in
  that folder (see [06-navigation.md](./06-navigation.md)).
- Duplicate routes (e.g. `guides.mdx` + `guides/index.mdx`) are a `blume doctor`
  error.

## 3. Frontmatter

YAML frontmatter parsed with `gray-matter`. Recognized keys (all optional):

```yaml
---
title: Quickstart            # page + nav title; falls back to first H1, then slug
description: Get up and running in five minutes
sidebarTitle: Quickstart     # override nav label only
icon: rocket                 # nav icon — Lucide name (resolved 09-I)
order: 1                     # ordering within its folder
group: Getting Started       # sidebar group label
draft: false                 # hidden in production when true
full: false                  # full-width layout (hide TOC/narrow container)
layout: doc                  # "doc" (default) | "landing" (full-bleed home, 09-U)
noindex: false               # exclude from search + robots
---
```

Unknown keys are preserved and exposed to components via context (so users can add
custom metadata and read it in overrides).

## 4. MDX compilation

Pipeline (remark → rehype):

**Philosophy:** the renderer ships **batteries-included**. A new user gets GFM,
callouts, syntax highlighting, anchored headings, typographic polish — *and* math,
diagrams, and TS hovers — with zero configuration, matching and exceeding what
Mintlify/Fumadocs give by default. The heavier features are **tree-shaken per page**
(resolved 09-S): a page with no math never loads KaTeX, no diagram never loads
Mermaid, etc., so "everything on" stays cheap.

### Always on (the preconfigured baseline)
- **remark-frontmatter** + **remark-mdx-frontmatter** — parse/expose frontmatter.
- **remark-gfm** — tables, strikethrough, task lists, autolinks, footnotes.
- **remark-smartypants** — smart quotes, dashes, ellipses.
- **remark-directive** + Blume directive plugin — `:::note`/`:::warning` admonition
  syntax in addition to GitHub-style `> [!NOTE]`.
- **rehype-slug** — heading ids.
- **rehype-autolink-headings** — clickable heading anchors.
- **Shiki** (via `rehype-pretty-code`) — syntax highlighting with line highlighting,
  line numbers, word/range highlight, diff, focus, and titles. **Dual-theme**
  (light/dark) synced to color mode; theme ids + defaults (line numbers, copy
  button, extra langs) come from `config.theme.code` ([04](./04-configuration.md)).
- **Custom Blume plugins** — callout/admonition transform, code-group detection,
  `<Steps>` sugar, internal-link rewriting + validation, external-link `rel`/target,
  `<img>` → optimized image, copy-button injection on code blocks.

### Also on by default — tree-shaken per page (resolved 09-S)
- **remark-math** + **rehype-katex** — LaTeX math (`$...$`, `$$...$$`). KaTeX loads
  only on pages that contain math.
- **Mermaid** — fenced ```mermaid``` diagrams; the Mermaid runtime loads only on
  pages with a diagram.
- **Twoslash** — TypeScript type-on-hover in code samples; activates only for
  Twoslash-flagged code blocks.

### Extensible
- User remark/rehype plugins appended via `config.mdx.remarkPlugins` /
  `rehypePlugins`.
- The whole built-in plugin list is **inspectable and reorderable** via config
  (e.g. `config.mdx.plugins` presets) so power users aren't boxed in.

> **DECISION (see 09-B):** compile strategy — bundle MDX at build into the app
> (fast runtime, à la `fumadocs-mdx`/Contentlayer) vs. compile per-request via a
> remote-MDX approach (simpler, more dynamic). Leaning build-time bundling for
> performance and static export; revisit.

## 5. Built-in MDX components ("standard library")

Available in any MDX file **without import**, all overridable via `components.tsx`.
The goal is **parity with both Mintlify and Fumadocs out of the box** — see the
full catalogue, parity matrix, and prop shapes in
[10-components.md](./10-components.md). Highlights:

- Callout family (`Note`, `Tip`, `Warning`, `Info`, `Check`, `Danger`)
- `Tabs`/`Tab`, `Steps`/`Step`, `Accordion`/`Accordions`
- `Card`/`Cards`/`Columns`, `Frame`, `CodeGroup`
- `TypeTable` / `AutoTypeTable`, `ParamField`, `ResponseField`, `Expandable`
- `Files`/`File`/`Folder`, `Mermaid`, `Tooltip`, `Icon`, `Update`, `Banner`

All are built on **shadcn/ui** primitives (see [10](./10-components.md) and
[07-theming.md](./07-theming.md)) and registered in the `mdx` registry. Overriding
`Callout` in `components.tsx` changes every callout site-wide.

## 6. Table of contents

Headings (`h2`–`h3` by default, configurable depth) are extracted into a TOC per
page and stored in the manifest. The right-rail TOC component highlights the
active section via an IntersectionObserver (client component).

## 7. Navigation tree

The full route set plus `meta.json` and frontmatter is assembled into a nav tree
(groups, order, icons, external links). This drives the sidebar and tabs. Details
in [06-navigation.md](./06-navigation.md).

## 8. Manifest

Everything above is serialized to `.blume/blume.manifest.json`:

```jsonc
{
  "routes": {
    "/quickstart": {
      "file": "content/quickstart.mdx",
      "frontmatter": { "title": "Quickstart", "order": 1 },
      "toc": [{ "depth": 2, "text": "Install", "id": "install" }]
    }
  },
  "nav": [ /* tree of groups/items */ ],
  "tabs": [ /* optional top-level sections */ ]
}
```

The runtime reads this manifest; it never re-scans the filesystem at request time.

## 9. Search index

Build a search index from compiled content (title, headings, body text, route).

> **RESOLVED (09-G):** default provider is **Pagefind** — static, zero-infra,
> indexes the built output, so search works on any static host. A pluggable
> **adapter** interface (`config.search.provider`) lets teams swap in Algolia,
> Orama, or others without touching components.

## 10. Assets & links

- `public/` is copied/served as static assets (Next convention).
- Relative links between MDX files are resolved to routes and validated
  (`blume doctor` reports broken internal links).
- Images can use Next `<Image>` via the default `img` override where it makes
  sense; static-export image strategy is covered in [14-quality.md](./14-quality.md).

## 11. Content reuse — snippets, variables, defaults (resolved 09-AA)

Three reuse mechanisms ship in v1:

- **Snippets (reusable partials):** `_`-prefixed files (e.g. `_intro.mdx`) are
  excluded from routing (§1) and imported into pages via the `<Snippet>` component
  or MDX import. Write once, include anywhere.
- **Variables:** `{{ name }}` placeholders in MDX are substituted at compile time
  from `config.variables` (e.g. `{{ version }}`, `{{ productName }}`). Useful for
  values that change across the whole site.
- **Per-folder frontmatter defaults:** a folder's `meta.json` may set
  `frontmatterDefaults` that apply to all pages beneath it (e.g. a default `group`
  or `icon`), overridable per page. Reduces repetition in large sections. See the
  `meta.json` schema in [17-meta-schema.md](./17-meta-schema.md).

`blume doctor` flags unknown variables and missing snippet targets.
