---
"blume": patch
---

Reword the `BLUME_ENTRY_ID_MISMATCH` suggestion to the configurations that actually resolve it: a single filesystem source, or every filesystem source rooted at `content.root` and partitioned with `include` globs — the previous advice (any root under `content.root`) reproduced the error.
