---
"blume": minor
---

Remove the programmatic migrators, Mintlify bridge mode, and the Mintlify-compatibility surface in favor of a `blume-migrate` agent skill. This is a breaking change.

**Migration is now an agent skill.** `blume migrate <tool>`, the automatic `docs.json` bridge mode, and the `mintlify` content source are gone. Migrate a docs repo (Mintlify, Docusaurus, Fumadocs, Nextra, Starlight, or any framework) with the new skill: `npx skills use haydenbleasel/blume@blume-migrate`, then run `/blume-migrate` in Claude Code. The skill ships in the package at `node_modules/blume/skills`.

**Icons are Lucide-only.** The FontAwesome and Tabler icon sets, the `icons.library` config, the `iconType` frontmatter/prop, and the `fa6-*`/`tabler` name prefixes are removed. Use bare Lucide names everywhere an icon is accepted.

**Removed config fields** (validate-but-never-rendered Mintlify-compat): `banner.color`, `banner.type`, top-level `favicon` (favicons are detected by filename — drop `icon`/`favicon.{svg,png,ico}` in the project root or `public/`), `navigation.chromeVariants`, `icons`, `seo.metatags`, `search.prompt`, `variables`, `theme.backgroundDecoration`, and `content.assets` (move root asset dirs into `public/` — Astro serves it at the site root).

**Removed frontmatter keys** (unknown keys are build errors): `sidebarTitle` (use `sidebar.label`), `tag` (use `sidebar.badge`), `mode`, `public`, `rss`, `hideApiMarker`, `hideFooterPagination`, `groups`, `keywords`, and `iconType`.

**Removed components:** `<Warning>` (use the `:::warning` directive) and the `<ParamField>`/`<ResponseField>`/`<RequestField>`/`<ApiField>` field family (use `<TypeTable>`, or the OpenAPI reference for spec'd APIs).
