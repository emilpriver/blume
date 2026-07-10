---
"blume": patch
---

`useAskAI().ask()` now catches a thrown fetch (offline, DNS failure, CORS) and shows the error notice instead of rejecting and leaving an empty assistant message stuck as a placeholder.
