# 15 — Content Model: Routes, Collections, Schemas, Feeds

Beyond "a folder of MDX," Blume's content model supports custom React pages, named
content collections (blog/changelog), optional typed frontmatter, and feeds. This
doc covers those; the core pipeline is [03-content-pipeline.md](./03-content-pipeline.md).

## Route file types (resolved 09-AE)

A file in the content tree becomes a route based on its extension:

| Extension | Becomes |
| --- | --- |
| `.md` / `.mdx` | A rendered content page (the default path). |
| `.tsx` / `.jsx` | A **custom React page** — the default export *is* the route. |
| `_`-prefixed | Excluded (snippets/partials, see [03](./03-content-pipeline.md)). |

**Custom React pages** are the escape hatch for fully bespoke/interactive routes
beyond MDX and the landing layout:
- The file's default export renders at its file→URL path (same routing rules).
- It has access to Blume's context (`useBlume()`), config, and nav.
- It opts into chrome via an exported meta: `export const meta = { layout: "doc" |
  "landing" | "none" }` (`none` = bare page, no sidebar/TOC).
- Interactive pages must be client components (`"use client"`, resolved 09-E).

## Content collections (resolved 09-AF)

The content root is the implicit **`docs`** collection. Additional **named
collections** are declared in config — each with a `path`, a `type`, and an optional
schema:

```ts
// blume.config.ts
import { z } from "zod";

collections: {
  blog: {
    type: "blog",
    path: "blog",
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      author: z.string(),
      tags: z.array(z.string()).optional(),
    }),
  },
  changelog: { type: "changelog", path: "changelog" },
},
```

Collection **types** and what they generate:
- **`doc`** (default) — standard docs pages; what the root collection is.
- **`blog`** — dated posts; auto **list/index page**, per-post pages, ordering by
  `date`, optional **tag/author** index pages, and a **feed**.
- **`changelog`** — dated entries; auto **list page** + **feed**; pairs with the
  `Update` component ([10-components.md](./10-components.md)).

List/detail rendering uses **overridable templates** (`BlogList`, `BlogPost`,
`ChangelogList`) in the `layout` registry — restyle or replace via `components.tsx`.
Collections appear in nav/tabs as configured, are included in search + llms.txt
(unless excluded), and respect the same theming.

## Collection sources: files or GitHub Releases (resolved 09-AM)

A collection's entries can come from local files (default) **or** be auto-generated
from a source — most usefully **GitHub Releases** for a changelog. Set via `source`:

```ts
collections: {
  // default: your own MD/MDX files under `path`
  changelog: { type: "changelog", path: "changelog" },

  // OR: auto-generate from GitHub Releases (opt in)
  changelog: {
    type: "changelog",
    path: "changelog",                 // route base
    source: { type: "github", repo: "acme/acme" },
  },
}
```

- **`source: { type: "files" }`** (default) — entries are MD/MDX files under `path`.
  This is the opt-out: define your own.
- **`source: { type: "github", repo }`** — at **build time**, Blume fetches releases
  and maps each to an entry: `tag_name → version/label`, `name → title`,
  `published_at → date`, `body` (markdown) → rendered content. Drafts/prereleases are
  filtered by default (configurable). Uses `GITHUB_TOKEN` from env when present to
  avoid rate limits; fully static once built.
- **Augment:** local files under `path` can supplement/override generated entries
  (matched by version/tag) for hand-written notes.

This pairs with the release process in [14-quality.md](./14-quality.md): changesets
cut **GitHub Releases**, which then populate the docs changelog automatically — or
you ignore that and write changelog MD by hand.

## Typed frontmatter / schemas (resolved 09-AG)

Frontmatter validation is **opt-in per collection** via a **Zod** schema (Astro-style
content collections):
- The schema validates frontmatter at build and yields TypeScript types for that
  collection's entries.
- Blume's built-in frontmatter fields (title/description/icon/…) are always
  available; a schema is **additive** — it can require or extend fields.
- Validation errors surface via `blume doctor` and the dev overlay, naming the file
  and offending field.
- **Without a schema**, behavior is the loose default: known fields used, unknown
  keys passed through untyped ([03](./03-content-pipeline.md) §3).

## Feeds (part of 09-AF)

Blog/changelog collections emit feeds at **build time** (fully static-friendly):
- **RSS** + **Atom** (and optionally **JSON Feed**) per collection.
- A `<link rel="alternate">` is injected on the relevant pages for discovery.
- Configurable per collection or via a top-level `feeds` option (title, limit).

## How this interacts with the rest

- **Routing/manifest** — `.tsx` routes and collection entries are first-class
  `RouteEntry`s in the manifest ([12-internals.md](./12-internals.md)); collection
  entries carry their (validated) frontmatter.
- **AI** — collection content is indexed and included in `llms.txt`/raw `.md`
  unless `noindex`/excluded ([11-ai.md](./11-ai.md)).
- **Search** — collections are indexed like docs; results can be grouped by
  collection.
