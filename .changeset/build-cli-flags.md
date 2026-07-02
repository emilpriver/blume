---
"blume": minor
---

`blume build` gains deployment override flags — `--output static|server`,
`--adapter vercel|node|netlify|cloudflare`, and `--base <path>` — that override
the corresponding `blume.config.ts` deployment fields for one build (handy for CI
matrices and previews). `--analyze` prints a client-JavaScript bundle report
(each `_astro/*.js` chunk largest-first, plus the total) so you can catch
weight regressions without extra tooling.
