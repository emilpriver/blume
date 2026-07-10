---
"blume": patch
---

Fix `.env` parsing corrupting escaped backslashes in double-quoted values (e.g. `"C:\\path\\new"` gained a newline): escape sequences are now expanded in a single pass so each backslash is consumed exactly once.
