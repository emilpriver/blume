---
"blume": patch
---

Preserve exact redirect status codes in the generated `vercel.json` (using `statusCode` instead of the boolean `permanent`), so a configured 301 no longer ships as 308 and a 302 no longer ships as 307 on Vercel.
