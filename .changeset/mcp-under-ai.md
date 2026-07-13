---
"blume": patch
---

Move the MCP server config under `ai` in `blume.config.ts`, alongside the other agent-facing features. Rename `mcp: { … }` to `ai: { mcp: { … } }` — the shape of the block is unchanged.
