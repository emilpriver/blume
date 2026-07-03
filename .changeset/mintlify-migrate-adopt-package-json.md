---
"blume": patch
---

`blume migrate mintlify` now adopts an existing `package.json` instead of leaving it untouched. Previously the migrator only scaffolded a manifest for config-only Mintlify repos; when one already existed (e.g. a `mintlify dev` project), it skipped it entirely — leaving the `mintlify` dependency in place, `blume` unadded, and the `dev` script still invoking the Mintlify CLI. It now repoints the `dev`/`build`/`start` scripts at the Blume CLI, drops the `mintlify` dependency from `dependencies`/`devDependencies`, and adds `blume`, so a migrated project runs with a plain `npm install && npm run dev`.
