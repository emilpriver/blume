/**
 * Normalize an X account to the leading `@` that `twitter:site`/`twitter:creator`
 * require, so `acme`, `@acme`, and `  @acme ` all land on `@acme`. Empty or
 * blank input yields undefined, which renders no tag at all.
 *
 * The layouts call this on values that never passed through the config schema:
 * Astro's collections carry no schema here, so a page's `seo.x.creator` reaches
 * them as raw frontmatter, and the schema's own transform never runs on it.
 * (Blume's page pipeline does reject a non-string `creator` before the page is
 * built, so `unknown` is defense in depth rather than the expected path.)
 */
export const normalizeXHandle = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return;
  }
  const handle = value.trim().replace(/^@+/u, "");
  return handle ? `@${handle}` : undefined;
};
