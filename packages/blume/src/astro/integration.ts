import type { AstroIntegration } from "astro";

/** A user page mounted into the generated runtime. */
export interface BlumePageRoute {
  /** Route pattern, e.g. `/changelog` or `/examples/[slug]`. */
  pattern: string;
  /** Absolute path to the user's `.astro` page file. */
  entrypoint: string;
}

export interface BlumeIntegrationOptions {
  pages: BlumePageRoute[];
}

/**
 * Blume's Astro integration. Mounts user-authored pages from `pages/` into the
 * generated runtime via `injectRoute`, keeping each file in its original
 * location so relative imports and `getStaticPaths` keep working.
 */
export const blumeIntegration = (
  options: BlumeIntegrationOptions
): AstroIntegration => ({
  hooks: {
    "astro:config:setup": ({ injectRoute }) => {
      for (const page of options.pages) {
        injectRoute({
          entrypoint: page.entrypoint,
          pattern: page.pattern,
          prerender: true,
        });
      }
    },
  },
  name: "blume",
});
