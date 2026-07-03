---
"blume": patch
---

Migrator and search-sync cleanups: stripping old-framework imports no longer collapses double blank lines inside code fences (the gap-collapse now targets only the removal seams, across the Mintlify, Fumadocs, and Starlight migrators); the Nextra migrator repoints `package.json` scripts at Blume and gitignores `.blume/`/`dist/` like the Fumadocs one (previously `npm run dev` still launched Next against the gutted content tree); the Mintlify migrator's two local path-containment checks now use the shared `isInsideRoot`, closing a Windows-only gap where a cross-drive `$ref`/snippet path escaped the project root; and the Typesense and Orama Cloud syncs now carry the documented `locale` facet so i18n sites can filter hosted results per language.
