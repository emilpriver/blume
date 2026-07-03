---
"blume": patch
---

`SourceEntry.slug` is now honored. The custom-source SPI documents `slug` as "logical route input; defaults to `ref` if omitted", but normalization only ever read `ref` — an adapter returning `{ ref: "abc123.md", slug: "custom/path" }` routed to `/abc123` with no diagnostic. Frontmatter `slug` still wins over the adapter-supplied one.
