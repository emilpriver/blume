---
"blume": patch
---

`blume validate --strict` no longer fails on info-level notes (like `BLUME_ASSETS_UNCHECKED` when there is no `public/` directory) — it treats warnings and errors as failures, as documented.
