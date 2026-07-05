---
"blume": patch
---

Fix `output: "server"` builds deploying a 404. The Vercel/Netlify adapters write their deploy bundle relative to the Astro project root, which Blume points at the hidden `.blume/` runtime — so the bundle (`.vercel/output`, `.netlify/`) landed at `.blume/.vercel/output`, where the platform never looks, while `dist/` held only the client assets (no root page, no function). `blume build` now surfaces a server adapter's bundle up to the real project root, writes deploy artifacts (robots.txt, sitemap.xml, llms.txt, …) into the served static dir, and adds the surfaced dir to `.gitignore`. Vercel (and any Build Output API host) then picks it up with zero config — an imported Blume project deploys on the default Astro settings. Node/Cloudflare emit into `dist/` and are unaffected.
