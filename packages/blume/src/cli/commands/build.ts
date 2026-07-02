import { existsSync } from "node:fs";
import { readdir, stat, writeFile } from "node:fs/promises";

import { build } from "astro";
import { defineCommand } from "citty";
import { join } from "pathe";

import { buildLlmsFiles } from "../../ai/llms.ts";
import { serverFeatures } from "../../core/server-features.ts";
import { buildRobots } from "../../deploy/robots.ts";
import { buildSitemap } from "../../deploy/sitemap.ts";
import { buildSearchIndex } from "../../search/build.ts";
import { syncSearchProvider } from "../../search/sync/index.ts";
import { logger } from "../log.ts";
import { prepareProject } from "../prepare.ts";

const ADAPTERS = ["vercel", "node", "netlify", "cloudflare"] as const;

const formatBytes = (bytes: number): string =>
  bytes < 1024
    ? `${bytes} B`
    : `${(bytes / 1024).toFixed(bytes < 1024 * 100 ? 1 : 0)} kB`;

/**
 * Print the client JavaScript Astro shipped, largest first, plus the total. A
 * dependency-free bundle report — the interactive weight of a docs site is its
 * `_astro/*.js`, so this surfaces regressions without a visualizer.
 */
const reportBundleSizes = async (distDir: string): Promise<void> => {
  const astroDir = join(distDir, "_astro");
  if (!existsSync(astroDir)) {
    logger.info("No client JavaScript emitted — the site ships zero JS.");
    return;
  }
  const entries = await readdir(astroDir);
  const files = entries.filter((name) => name.endsWith(".js"));
  const sized = await Promise.all(
    files.map(async (name) => {
      const info = await stat(join(astroDir, name));
      return { name, size: info.size };
    })
  );
  sized.sort((a, b) => b.size - a.size);
  const total = sized.reduce((sum, file) => sum + file.size, 0);
  const rows = sized
    .slice(0, 15)
    .map((file) => `  ${formatBytes(file.size).padStart(8)}  ${file.name}`);
  logger.box(
    [
      `Client JavaScript — ${sized.length} file(s), ${formatBytes(total)} total`,
      "",
      ...rows,
      sized.length > 15 ? `  … and ${sized.length - 15} more` : null,
    ]
      .filter((line) => line !== null)
      .join("\n")
  );
};

export const buildCommand = defineCommand({
  args: {
    adapter: {
      description: "Server adapter: vercel | node | netlify | cloudflare.",
      type: "string",
    },
    analyze: {
      description: "Report client JavaScript bundle sizes after the build.",
      type: "boolean",
    },
    base: {
      description: "Base path the site is served under (e.g. /docs).",
      type: "string",
    },
    output: {
      description: "Output mode: static | server.",
      type: "string",
    },
    preview: {
      description: "Include drafts and unpublished CMS content.",
      type: "boolean",
    },
    strict: { description: "Fail on diagnostics.", type: "boolean" },
  },
  meta: {
    description: "Build the docs site for production.",
    name: "build",
  },
  async run({ args }) {
    const root = process.cwd();

    if (args.output && args.output !== "static" && args.output !== "server") {
      logger.error(`Invalid --output "${args.output}" (use static | server).`);
      process.exit(1);
    }
    if (args.adapter && !ADAPTERS.includes(args.adapter as never)) {
      logger.error(
        `Invalid --adapter "${args.adapter}" (use ${ADAPTERS.join(" | ")}).`
      );
      process.exit(1);
    }

    const project = await prepareProject({
      mode: "build",
      overrides: {
        adapter: args.adapter as (typeof ADAPTERS)[number] | undefined,
        base: args.base,
        output: args.output as "server" | "static" | undefined,
      },
      preview: args.preview,
      root,
      strict: args.strict,
    });

    logger.start(
      `Building ${project.graph.pages.length} page(s) (${project.config.deployment.output} output)`
    );

    await build({
      logLevel: "info",
      root: project.context.outDir,
    });

    const distDir = join(root, "dist");

    if (project.config.search.provider === "pagefind") {
      logger.start("Building search index");
      const indexed = await buildSearchIndex(distDir);
      logger.success(`Indexed ${indexed} page(s) for search`);
    }

    // Upload the index to a hosted provider (Algolia, Orama Cloud, Typesense).
    // Skipped with a warning when its admin key isn't configured.
    await syncSearchProvider(project, {
      start: (message) => logger.start(message),
      success: (message) => logger.success(message),
      warn: (message) => logger.warn(message),
    });

    if (project.config.ai.llmsTxt) {
      const { index, full } = await buildLlmsFiles(project);
      await Promise.all([
        writeFile(join(distDir, "llms.txt"), index, "utf-8"),
        writeFile(join(distDir, "llms-full.txt"), full, "utf-8"),
      ]);
      logger.success("Generated llms.txt and llms-full.txt");
    }

    // A user's own public/ file (copied into dist by Astro) always wins.
    const sitemap = buildSitemap(project);
    if (sitemap && !existsSync(join(distDir, "sitemap.xml"))) {
      await writeFile(join(distDir, "sitemap.xml"), sitemap, "utf-8");
      logger.success("Generated sitemap.xml");
    }

    const robots = buildRobots(project);
    if (robots && !existsSync(join(distDir, "robots.txt"))) {
      await writeFile(join(distDir, "robots.txt"), robots, "utf-8");
      logger.success("Generated robots.txt");
    }

    const { config } = project;
    const features = serverFeatures(config);
    logger.box(
      [
        `Output     ${config.deployment.output}`,
        `Adapter    ${config.deployment.adapter ?? "none"}`,
        `Site       ${config.deployment.site ?? "not set"}`,
        `Search     ${config.search.provider}`,
        `Redirects  ${config.redirects.length}`,
        `Sitemap    ${sitemap ? "yes" : "no (set deployment.site)"}`,
        `Robots     ${robots ? "yes" : "no"}`,
        `LLM files  ${config.ai.llmsTxt ? "yes" : "no"}`,
        `Server features  ${features.length > 0 ? features.join(", ") : "none"}`,
      ].join("\n")
    );

    if (args.analyze) {
      await reportBundleSizes(distDir);
    }

    logger.success(`Built to ${distDir}`);
  },
});
