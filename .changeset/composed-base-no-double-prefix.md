---
"blume": patch
---

Content links that hand-write the site-wide `basePath` (`[x](/docs/guide)`) are no longer double-prefixed when `deployment.base` is also set: the markdown link rewriter now layers the two bases separately, so the link resolves to `/base/docs/guide` instead of `/base/docs/docs/guide`.
