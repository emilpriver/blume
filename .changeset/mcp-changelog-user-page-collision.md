---
"blume": patch
---

Check custom `.astro` pages (not just content pages) before generating the MCP endpoint and the `/changelog` index, so a user page at those routes warns and wins instead of silently colliding.
