---
"blume": patch
---

Expanded the built-in icon set and its FontAwesome/Lucide synonym map so far more icon names resolve. The curated set grows from 53 to 158 icons (common docs glyphs — `gauge`, `layers`, `shield`, `cpu`, `database`, `terminal`, `cable`, `file-text`, `folder-tree`, chart/cloud/list/user variants, and more), and the alias map grows from 15 to 177 entries mapping FontAwesome names to their closest Blume icon (`shield-halved` → `shield-half`, `layer-group` → `layers`, `arrows-rotate` → `refresh-cw`, `wand-magic-sparkles` → `wand-sparkles`, `user-shield` → `shield-user`, `gauge-high` → `gauge`, …). Sites migrated from FontAwesome-based Mintlify projects now render icons on Cards, Steps, and sidebar groups that previously resolved to nothing, and several icons referenced by Blume's own docs (`cable`, `file-text`, `folder-tree`) now render. Icons are inlined as zero-JS SVG server-side, so unused entries add nothing to the client payload.
