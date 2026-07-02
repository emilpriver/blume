---
"blume": patch
---

Blume now warns when a navigation icon name (in `blume.config.ts`, folder meta,
or a page's `sidebar.icon`) isn't in its icon set — a typo used to just render
nothing. Image paths, URLs, and inline SVG icons are left alone. Surfaced by
`blume dev`, `blume build`, and `blume doctor`.
