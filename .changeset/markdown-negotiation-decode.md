---
"blume": patch
---

Decode percent-encoded request paths in markdown content negotiation, so `Accept: text/markdown` requests for non-ASCII routes serve the `.md` variant instead of silently falling through to HTML.
