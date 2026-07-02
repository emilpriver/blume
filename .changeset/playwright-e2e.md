---
"blume": patch
---

Add a Playwright end-to-end harness for the docs site (a real Blume project, so
it doubles as the framework's browser coverage). `playwright.config.ts` builds
and previews the site, and `e2e/site.spec.ts` drives navigation, the sidebar,
theme toggle, the mobile drawer, the search dialog, code-copy, tabs, and a custom
page. Run with `bun run test:e2e` (after `bunx playwright install`).
