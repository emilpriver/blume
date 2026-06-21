# 17 — `meta.json` Schema

`meta.json` is the **per-folder** file that refines how a folder and its children
appear in navigation — ordering, labels, grouping, icons, and frontmatter defaults.
It's the middle rung of the nav precedence (resolved 09-H):

> **`config.navigation` > `meta.json` > filesystem**

A folder with no `meta.json` is fully auto-derived (zero-config). Add one only when
you want control.

## Location & format

- One optional `meta.json` per folder, alongside its content files.
- JSON, with a published **`$schema`** for editor autocomplete/validation:
  ```json
  { "$schema": "https://blume.dev/schema/meta.json", "title": "Guides" }
  ```
- Validated with the same Zod layer as config; errors surface per
  [18-errors.md](./18-errors.md).

## Schema

```ts
interface Meta {
  // ── This folder as a sidebar group ──────────────────────
  title?: string;                  // group label (default: humanized folder name)
  icon?: string;                   // Lucide name (09-I)
  order?: number;                  // order of this folder among its siblings
  collapsed?: boolean;             // default collapsed state (default: false → 09-AD)
  hidden?: boolean;                // omit this folder from nav (pages still routable)

  // ── Ordering & inclusion of children ────────────────────
  pages?: MetaItem[];              // explicit order; see resolution rules below

  // ── Defaults for all pages beneath this folder (09-AA) ──
  frontmatterDefaults?: Partial<Frontmatter>;  // e.g. { group: "API", icon: "code" }
}

type MetaItem =
  | string                         // child slug, "*" (rest), or "---" (divider)
  | { divider: string }            // labeled section header
  | {                              // explicit / external link
      label: string;
      href: string;                // internal route or external URL
      icon?: string;
      badge?: string;
    };
```

`Frontmatter` is the page frontmatter shape from [12-internals.md](./12-internals.md).

## `pages` resolution rules

The filesystem provides the candidate children (files + subfolders). `pages` then
orders and filters them:

- **A bare string** is a child slug (`"quickstart"`) or subfolder name. It places
  that child at this position.
- **`"*"`** expands to *all remaining* children not explicitly listed, in their
  default order (frontmatter `order` → title → filename). Use it to pin a few items
  and let the rest follow.
- **`"---"`** inserts an unlabeled divider; **`{ "divider": "Advanced" }`** a
  labeled section header.
- **A link object** inserts an explicit internal/external link (e.g. a changelog or
  an off-site URL).

**Authority:** if `pages` is present, it is authoritative — children **not** listed
and **not** covered by `"*"` are **hidden from nav** (still routable by URL). Omit
`pages` entirely to show everything in default order. Listing an unknown slug is a
`blume doctor` warning.

## Examples

Order a few, divider, then the rest:
```json
{
  "title": "Getting Started",
  "icon": "rocket",
  "order": 1,
  "pages": [
    "introduction",
    "quickstart",
    "---",
    "configuration",
    "*",
    { "divider": "Reference" },
    { "label": "Changelog", "href": "/changelog", "icon": "history" },
    { "label": "GitHub", "href": "https://github.com/acme/acme", "badge": "↗" }
  ]
}
```

Apply shared defaults to every page in a folder:
```json
{ "title": "API", "frontmatterDefaults": { "group": "API", "icon": "code" } }
```

## Precedence & merging

1. **Filesystem** seeds the candidate set and default order.
2. **`meta.json`** orders/filters/labels/groups and applies `frontmatterDefaults`
   (a page's own frontmatter always wins over defaults).
3. **`config.navigation`** (if provided) overrides the assembled tree (09-H).

The resolved tree is serialized into the manifest's `nav` (NavNode[],
[12-internals.md](./12-internals.md)); the runtime never re-reads `meta.json`.

## Notes

- **Tabs:** a tab points at a path ([06-navigation.md](./06-navigation.md)); the
  folder at that path uses its own `meta.json` for that tab's sidebar.
- **Collections:** blog/changelog collections ([15](./15-content-types.md)) order by
  date by default; a `meta.json` in a collection folder can still set the group
  `title`/`icon`.
- **Typed alternative (future):** a `meta.ts` returning the same shape could allow
  imports/typing later; v1 ships `meta.json` + `$schema`.
