import { readFile, writeFile } from "node:fs/promises";

import { defineCommand } from "citty";
import { join, relative } from "pathe";

import { eject } from "../../registry/eject.ts";
import { refuseIfDevRunning } from "../dev-lock.ts";
import { logger } from "../log.ts";

const updatePackageScripts = async (root: string): Promise<void> => {
  const pkgPath = join(root, "package.json");
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  } catch {
    return;
  }
  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  pkg.scripts = {
    ...scripts,
    build: "astro build",
    dev: "astro dev",
    preview: "astro preview",
  };
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
};

export const ejectCommand = defineCommand({
  args: {
    yes: { description: "Skip the confirmation prompt.", type: "boolean" },
  },
  meta: {
    description: "Promote the generated runtime into an owned Astro project.",
    name: "eject",
  },
  async run({ args }) {
    const root = process.cwd();
    refuseIfDevRunning(root, "ejecting");

    if (!args.yes) {
      logger.warn(
        "Eject is one-way: it writes astro.config.mjs, src/, and (if absent) tsconfig.json, rewrites your package.json scripts, and removes .blume. An existing tsconfig.json is left untouched."
      );
      logger.info("Re-run with --yes to proceed.");
      return;
    }

    const files = await eject(root);
    await updatePackageScripts(root);

    logger.success(`Ejected ${files.length} file(s):`);
    for (const file of files) {
      process.stdout.write(`  ${relative(root, file)}\n`);
    }
    logger.box(
      "Your project is now a standalone Astro app.\n\n  bun run dev\n  bun run build\n\nThe blume package remains importable."
    );
  },
});
