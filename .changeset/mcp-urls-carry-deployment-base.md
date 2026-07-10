---
"blume": patch
---

MCP URLs now carry `deployment.base`: the server URL advertised by `/.well-known/mcp.json` and the server card, and the page URLs returned by the `search_docs` and `list_pages` tools, previously pointed at base-less paths on subdirectory deployments.
