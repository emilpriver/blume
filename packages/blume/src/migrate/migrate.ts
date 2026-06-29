import { migrateFumadocsProject } from "./fumadocs/index.ts";
import { migrateMintlifyProject } from "./mintlify/index.ts";
import { migrateNextraProject } from "./nextra/index.ts";
import { migrateStarlightProject } from "./starlight/index.ts";

export interface MigrationResult {
  moved: number;
  warnings: string[];
}

/**
 * Migrate a Mintlify project (`docs.json`/`mint.json` + MDX). Translates the
 * config, rewrites pages to idiomatic Blume MDX in place, and relocates assets.
 * Unlike the other migrators, content stays at the project root.
 */
export const migrateMintlify = (root: string): Promise<MigrationResult> =>
  migrateMintlifyProject(root);

/**
 * Migrate a Nextra project (`content/` or `pages/` + `_meta` files). Moves pages
 * into `docs/`, rewrites `<Callout>`s to directives, and converts every `_meta`
 * into a typed `meta.ts`, preserving navigation order and titles.
 */
export const migrateNextra = (root: string): Promise<MigrationResult> =>
  migrateNextraProject(root);

/**
 * Migrate a Fumadocs project (`content/docs` + `meta.json`). Moves pages into
 * `docs/`, rewrites Fumadocs MDX (callouts, `<Cards>`/`<Accordions>`/`<Files>`,
 * `<Tabs items>`, `<include>`) to idiomatic Blume markup, converts every
 * `meta.json` into a typed `meta.ts`, and preserves the `/docs` route prefix.
 */
export const migrateFumadocs = (root: string): Promise<MigrationResult> =>
  migrateFumadocsProject(root);

/**
 * Migrate a Starlight project (`src/content/docs` + `astro.config.*`). Translates
 * the `starlight({...})` options into `blume.config.ts` and rewrites each page to
 * idiomatic Blume MDX in place (asides → directives, component renames,
 * frontmatter mapping). Content stays under `src/content/docs`.
 */
export const migrateStarlight = (root: string): Promise<MigrationResult> =>
  migrateStarlightProject(root);

export const migrators: Record<
  string,
  (root: string) => Promise<MigrationResult>
> = {
  fumadocs: migrateFumadocs,
  mintlify: migrateMintlify,
  nextra: migrateNextra,
  starlight: migrateStarlight,
};
