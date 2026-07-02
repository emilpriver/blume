---
"blume": minor
---

Static builds now emit platform redirect files so hosts issue real HTTP
redirects instead of only Astro's client-side redirect pages: `_redirects`
(Netlify, Cloudflare Pages), `vercel.json` (Vercel), and a structured
`blume-redirects.json` manifest for manual wiring. A `_redirects`/`vercel.json`
you ship in `public/` is preserved. Server/adapter builds are unchanged (the
adapter handles redirects natively).
