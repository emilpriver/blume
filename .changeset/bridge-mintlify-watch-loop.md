---
"blume": patch
---

`blume dev` in Mintlify bridge mode no longer regenerates in a loop. Bridge mode roots content at the project directory, which contains Blume's generated `.blume/` output — and the dev server rewrites `.blume/.astro/data-store.json` on every request. The Mintlify source's recursive `fs.watch` saw those writes and re-ran a full rescan + runtime regeneration, whose own writes landed back under `.blume/` and re-fired the watcher: a self-sustaining storm that stalled page renders (8–26s) and flooded the console with `[glob-loader]` reloads. The watcher now ignores events under `.blume/`, `node_modules`, and other non-content trees, and the generated `docs` collection excludes `node_modules` plus the runtime dir when it sits inside the content root, so Astro's content watcher no longer walks `.blume/` either. Normal (non-bridge) projects were unaffected, since their content root sits below `.blume/`.
