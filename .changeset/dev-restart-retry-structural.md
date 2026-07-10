---
"blume": patch
---

Fix `blume dev` staying permanently down after a failed structural restart: the route signature is now committed only once the restart succeeds, so the next file change retries the restart instead of taking the hot-reload path against a stopped server.
