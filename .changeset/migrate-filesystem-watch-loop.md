---
"blume": patch
---

`blume dev` on a migrated Mintlify project (`content.root: "."`) no longer loops or fails to load. A migrated project keeps its pages at the project root, which also contains Blume's generated `.blume/` output — and the dev server rewrites files under `.blume/` (its data store, content-module manifests, self-hosted fonts, and the regenerated `src/generated/*` data modules) as it renders. Two watchers fed on those writes:

- The **filesystem content source**'s recursive `fs.watch` saw every `.blume/` write and re-ran a full rescan + runtime regeneration, whose own writes landed back under `.blume/` and re-fired the watcher — a self-sustaining loop that spammed the console with repeating `data-store.json` reloads and, by rewriting the runtime mid-render, broke Astro's dev module graph (`Failed to load url astro:server-app.js`). This is the same storm the Mintlify bridge source was already hardened against; the fix is now shared, so the filesystem source ignores events under `.blume/`, VCS/dependency trees, and every excluded directory.
- Astro's content-layer `docs` glob loader is rooted at the project directory, so it logged `No entry type found` / `Reloaded data` for every write Astro makes under its own cache dir (`.blume/.astro/`). The generated dev config now keeps Vite's file watcher out of that cache dir.

As a defence in depth, dev regeneration is now single-flighted: a burst of watch events (or any future storm) coalesces into one trailing scan instead of piling up overlapping scans, which on a large project could outlast the debounce and exhaust the heap (the loop above eventually OOM-crashed the dev server).

Normal projects, whose content root sits outside `.blume/`, were unaffected.
