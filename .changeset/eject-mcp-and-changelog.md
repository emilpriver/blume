---
"blume": patch
---

`blume eject` now emits the hosted MCP server (endpoint, data snapshot, and `.well-known` discovery documents) and the `/changelog` index page, so ejected apps no longer 404 on routes the generated runtime served.
