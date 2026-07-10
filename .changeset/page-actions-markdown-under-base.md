---
"blume": patch
---

Page actions now reach the raw-markdown endpoint under `deployment.base`: the "Open in ChatGPT/Claude/…" links and "Copy as Markdown" previously fetched the base-less `/page.md` path (a 404) on subdirectory deployments.
