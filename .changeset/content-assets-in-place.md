---
"blume": minor
---

Add `content.assets`: top-level directories served at the site root alongside `public/`. This lets a project keep root-served asset folders in place instead of relocating them under `public/`. The generated runtime serves each mount in dev (Astro only serves `publicDir`) and copies it into `dist/` on build, and link validation resolves asset references against these mounts too.

The Mintlify migrator now uses this instead of moving whole asset directories: referenced dirs (e.g. `images/`) stay put and are recorded in `content.assets`, so a migration no longer churns every file under them. Loose top-level asset files (a root `favicon.png`/`logo.png`) still move under `public/`.
