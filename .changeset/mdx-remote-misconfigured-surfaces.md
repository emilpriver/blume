---
"blume": patch
---

An mdx-remote source missing both `{ github }` and `{ url, files }` now always fails with `BLUME_SOURCE_MISCONFIGURED`: the config is validated before the cached-fetch path, which previously masked it as `BLUME_SOURCE_FETCH_FAILED` or silently served stale cached entries with an offline warning.
