// Copies bundled assets into the package so they ship in the published tarball
// and resolve under node_modules/blume: the docs site content
// (apps/docs/content/docs -> docs/) and the agent skills (repo-root skills/ ->
// skills/). Both generated copies are gitignored; this runs on `prepare` (after
// install) and `prepack` (before publish) to keep them fresh. The originals
// (apps/docs/content/docs and the repo-root skills/) remain the source of truth.
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const here = import.meta.dirname;
const repoRoot = path.join(here, "..", "..", "..");

/** Mirror a source directory into the package, replacing any prior copy. */
const bundle = (from, to) => {
  if (existsSync(from)) {
    rmSync(to, { force: true, recursive: true });
    cpSync(from, to, { recursive: true });
    console.log(`[bundle-docs] copied ${from} -> ${to}`);
  } else {
    // Not a fatal error: a consumer installing the published package already has
    // the bundled copy in the tarball and has no source tree to copy from.
    console.warn(`[bundle-docs] source not found, skipping: ${from}`);
  }
};

bundle(
  path.join(repoRoot, "apps", "docs", "content", "docs"),
  path.join(here, "..", "docs")
);
bundle(path.join(repoRoot, "skills"), path.join(here, "..", "skills"));
