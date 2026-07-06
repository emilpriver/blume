---
"blume": patch
---

Make changelog entry heading/paragraph spacing actually apply. The `h2`/`h3`/`p` margins were normal-weight utilities, which Tailwind Typography's `.not-prose` margin reset outranked, so subsequent section headings still butted against the paragraph above. Mark the margins `!important` so they win.
