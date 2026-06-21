# 06 — Navigation

Navigation is auto-derived from the filesystem by default and refinable via
`meta.json` and frontmatter, with `blume.config.ts` available for full control.
The ladder mirrors Blume's overall philosophy: zero-config first, explicit when
you want it.

## Sources of truth (precedence)

1. **Filesystem** — folders and files define structure and default order
   (alphabetical, then `order` frontmatter).
2. **`meta.json`** (per folder) — labels, ordering, grouping, icons, inclusion of
   external links and dividers.
3. **`blume.config.ts` `navigation`** — explicit override; wins on conflict.

## `meta.json` (per folder)

```jsonc
{
  "title": "Getting Started",     // group label for this folder in the sidebar
  "icon": "rocket",
  "order": 1,
  "pages": [                       // explicit order; "*" = "everything else here"
    "introduction",
    "quickstart",
    "---",                        // divider
    { "label": "Changelog", "href": "https://..." },  // external link
    "*"
  ]
}
```

If a folder has no `meta.json`, its pages are ordered by frontmatter `order`, then
title, then filename. The **full `meta.json` schema** (resolution rules,
`frontmatterDefaults`, dividers, link items, `$schema`) is in
[17-meta-schema.md](./17-meta-schema.md).

## Sidebar

- **Groups** — from folders or `meta.json` `title`.
- **Collapsible sections**, nested arbitrarily deep. Default behavior:
  **multi-expand with persisted state** (multiple groups open at once, remembered
  across navigation) — `config.sidebar.expand` / `persist` (resolved 09-AD).
- **Active trail** highlighting from the manifest.
- **Icons** (Lucide name string, or a React node) and **badges** (e.g. `New`,
  `Beta`) via frontmatter/meta (resolved 09-I).
- **External links** with an indicator.
- The whole `Sidebar` (and `SidebarItem`) is overridable in `components.tsx`.

## Tabs (top-level sections)

Optional Mintlify-style tabs for large docs split into areas (Guides / API /
SDKs). Defined in `config.navigation.tabs`, each pointing at a path prefix. The
sidebar swaps to the active tab's subtree.

## Right-rail TOC

- Built from page headings in the manifest (`h2`–`h3` default depth).
- Active-heading highlight via IntersectionObserver (client component).
- Hidden on `full: true` pages.
- Overridable as `Toc`.

## Breadcrumbs

Derived from the active trail. Overridable as `Breadcrumbs`. Off by default on the
home route.

## Pager (prev / next)

Sequential previous/next links computed from the flattened, ordered nav tree.
Overridable as `Pager`.

## Page metadata footer (git-derived — resolved 09-AB)

Below the content, a metadata footer shows (all toggleable via `config.git`):
- **Last updated** — from the file's git history (commit date), computed at build.
- **Edit on GitHub** — link built from `config.git.editUrl` (the `EditOnGithub`
  slot).
- **Contributors** — avatars of people who touched the file, from git history.

Computed at build from the repo; degrades gracefully when not in a git checkout.
Overridable via the `PageMeta` / `EditOnGithub` layout slots.

A **feedback widget** ("Was this helpful?", optional comment) also sits in this
footer when `config.feedback.enabled` (resolved 09-AJ). It stays static-friendly by
emitting analytics events, with an optional webhook for raw responses. Overridable
as the `Feedback` slot.

## Mobile navigation

Collapsible drawer for sidebar + tabs; search and theme toggle accessible.
`MobileNav` overridable. All interactive bits are client components.

## Search UX

- `SearchButton` opens a command-palette dialog (⌘K).
- Backed by the search index from [03-content-pipeline.md](./03-content-pipeline.md).
- Keyboard navigable; results grouped by section; highlights matched headings.
- Default provider is **Pagefind** (static, zero-infra); pluggable via an adapter
  for Algolia/Orama/others (resolved 09-G).

## Versioning & i18n (post-1.0, but seam designed now — resolved 09-O)

Built post-1.0, but the **manifest/nav schema reserves a `version`/`locale`
dimension in v1** so we never retrofit:
- **Versions** — a version switcher that scopes the content root/manifest.
- **Locales** — a locale switcher; content under locale-prefixed roots.
Concretely: manifest route keys and the nav tree are designed to be addressable by
an optional `(version, locale)` tuple from day one, even though only a single
default version/locale ships in v1.
