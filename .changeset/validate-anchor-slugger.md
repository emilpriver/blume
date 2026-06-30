---
"blume": patch
---

Fix `blume validate` false-flagging valid heading anchors. Heading anchor ids were derived for the manifest with a hand-rolled slugifier that collapsed consecutive dashes (`--` → `-`) and didn't disambiguate repeated headings, while the renderer assigns ids with `github-slugger`. So a link like `/api/copy#the-read--write-fallback` (matching the real rendered id) was reported broken, and a link to a repeated heading's `#setup-1` had no match. Heading extraction now uses the same per-document `github-slugger` as the renderer, so the manifest's anchor ids — and the on-page table-of-contents links built from them — match the rendered heading ids exactly. (`slugify` still handles content/route slugs.)
