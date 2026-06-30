import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { join } from "pathe";

import { loadMintlifyConfig } from "../migrate/mintlify/config.ts";
import { mintlifyI18n } from "../migrate/mintlify/i18n.ts";
import type { BlumeConfig } from "./schema.ts";

/** A detected docs-tool config that Blume can serve without a migration. */
export interface BridgeDetection {
  /** Which foreign docs tool was detected. */
  tool: "mintlify";
  /** Absolute path of the detected config file (`docs.json`/`mint.json`). */
  configFile: string;
  /** A Blume config synthesized from the foreign config, ready to validate. */
  raw: BlumeConfig;
}

const MINTLIFY_CONFIG_FILES = ["docs.json", "mint.json"];

/**
 * Detect a Mintlify project at `root` and synthesize an equivalent Blume config.
 *
 * "Bridge mode" lets a team swap `mintlify dev` for `blume dev` with no file
 * changes: `docs.json` is translated to Blume config (`loadMintlifyConfig`) and
 * its content block is rewired to a single `mintlify` content source, which
 * transforms each MDX page to Blume idiom at scan time. The original
 * `content.root`/`exclude` and `variables` move onto the source (Blume has no
 * runtime variable substitution, so globals are inlined into content there).
 *
 * Returns `null` when no Mintlify config is present. Only called when no
 * `blume.config.*` exists, so an explicit Blume config always takes precedence.
 */
export const detectMintlifyBridge = async (
  root: string
): Promise<BridgeDetection | null> => {
  const configFile = MINTLIFY_CONFIG_FILES.map((name) => join(root, name)).find(
    (candidate) => existsSync(candidate)
  );
  if (!configFile) {
    return null;
  }

  const config = await loadMintlifyConfig(root, configFile);

  // i18n is derived from the raw spec (language dirs), mirroring the migrator.
  const spec = JSON.parse(await readFile(configFile, "utf-8")) as Record<
    string,
    unknown
  >;
  const i18n = mintlifyI18n(spec);
  if (i18n) {
    config.i18n = i18n;
    // Language switching is handled by Blume i18n, not a nav selector.
    if (config.navigation?.selectors) {
      config.navigation.selectors = config.navigation.selectors.filter(
        (selector) => selector.kind !== "language"
      );
    }
  }

  const variables = (config.variables as Record<string, string>) ?? {};
  const root_ = config.content?.root ?? ".";
  const exclude = config.content?.exclude ?? [];

  return {
    configFile,
    raw: {
      ...config,
      content: {
        // Mirror the excludes onto `content.exclude` too: the generated Astro
        // `docs` collection globs `content.root` (here the project root) and
        // must skip node_modules/snippets just like the source does.
        exclude,
        root: root_,
        sources: [
          {
            configFile,
            exclude,
            root: root_,
            type: "mintlify",
            variables,
          },
        ],
      },
      // Globals are inlined into content by the source; drop the top-level copy.
      variables: undefined,
    },
    tool: "mintlify",
  };
};
