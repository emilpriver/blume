---
"blume": patch
---

Dropped `navigation.sidebarVariants`, an unused per-partition sidebar mechanism. It was built, validated, and shipped in the data module, but no layout ever read it — the sidebar has always been scoped at render by the active **tab** via `sidebarForRoute`, and that remains the model. The Mintlify migrator emitted one variant per page (each carrying the full section sidebar), which is what ballooned a large migrated site's `blume.config.ts` to ~4.9 MB / 126k lines; it no longer emits any, so migrated configs shrink to a few KB. The `sidebarVariants` config field, its schema, the `NavSidebarVariant` type, and the variant folds in nav diagnostics are all removed.

Because `navigation` config is `.strict()`, a stale config that still carries a `sidebarVariants` key will now fail validation — drop the key or re-run `blume migrate mintlify` to regenerate a clean config.
