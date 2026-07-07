---
"blume": patch
---

Fix `blume dev` serving stale 404s after a content file or folder is renamed, added, or removed. Two dev-only Astro/Vite issues combined to leave a page 404ing (`Entry docs → … was not found`) until a manual restart: Astro's in-memory content store only refreshes on a cold container restart — its in-place restart does an incremental sync and its glob watcher misses directory renames — and a full reload could fail to resolve the `astro:server-app` dev entry (`Failed to load url astro:server-app.js`), corrupting the SSR module runner. Now a route-set change (add/remove/rename, including folders) triggers a clean dev-server restart that re-globs the content store, and a Vite resolver shim (`serverAppResolvePlugin`) keeps full reloads from breaking. Editing a page body still hot-reloads without a restart.
