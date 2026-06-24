import { readFileSync } from "node:fs";

import { dirname, join } from "pathe";

let cached: string | undefined;

/**
 * The installed Blume package version, read lazily from its `package.json`.
 *
 * Computed on demand (not at module load) so importing the `blume` barrel has no
 * filesystem side effect. This keeps the read out of the generated page runtime,
 * where the module may be bundled and the relative path would not resolve.
 */
export const getBlumeVersion = (): string => {
  if (cached === undefined) {
    const pkgPath = join(
      dirname(import.meta.filename),
      "..",
      "..",
      "package.json"
    );
    cached = (JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string })
      .version;
  }
  return cached;
};
