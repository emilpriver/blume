import { extname, relative } from "pathe";
import { glob } from "tinyglobby";

import type { BlumePageRoute } from "./integration.ts";

/**
 * Discover user `.astro` pages and map them to route patterns. Files keep their
 * original location; only the route pattern is derived (index -> parent,
 * dynamic `[param]` segments preserved).
 */
export const discoverPages = async (
  pagesRoot: string
): Promise<BlumePageRoute[]> => {
  const files = await glob(["**/*.astro"], {
    absolute: true,
    cwd: pagesRoot,
    onlyFiles: true,
  });
  files.sort();

  return files.map((file) => {
    const rel = relative(pagesRoot, file);
    const withoutExt = rel.slice(0, rel.length - extname(rel).length);
    const parts = withoutExt.split("/").filter((part) => part !== "index");
    const pattern = parts.length === 0 ? "/" : `/${parts.join("/")}`;
    return { entrypoint: file, pattern };
  });
};
