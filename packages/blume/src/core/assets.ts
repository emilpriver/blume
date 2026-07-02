import { join } from "pathe";

/** A static directory served at a URL prefix, in addition to `public/`. */
export interface AssetMount {
  /** Absolute filesystem path to the source directory (or file). */
  dir: string;
  /** URL path prefix the source is served at, e.g. `/images`. */
  url: string;
}

/**
 * Resolve `content.assets` entries (top-level dirs served at the site root,
 * alongside `public/`) to `{ dir, url }` mounts. Shared by the generated Astro
 * runtime (dev middleware + build copy) and by link validation, so all three
 * agree on where a `/images/foo.png` reference resolves on disk.
 *
 * Each entry is normalized to a leading-slash URL and joined to the project
 * root; leading `./` or `/` and any `..` segments are stripped so a mount can't
 * escape the root or collide with the site's own routing prefix.
 */
export const resolveAssetMounts = (
  root: string,
  assets: string[]
): AssetMount[] =>
  assets.map((entry) => {
    const rel = entry
      .replace(/^[./]+/u, "")
      .replaceAll(/\.\.\/?/gu, "")
      .replace(/\/+$/u, "");
    return { dir: join(root, rel), url: `/${rel}` };
  });
