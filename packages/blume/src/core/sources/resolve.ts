import { join } from "pathe";

import type { ContentSourceConfig, ResolvedConfig } from "../schema.ts";
import type { ProjectContext } from "../types.ts";
import { filesystemSource } from "./filesystem.ts";
import { mdxRemoteSource } from "./mdx-remote.ts";
import type { ContentSource, SourceContext } from "./types.ts";

/** Allocate a unique, stable source name from a base (prefix or type). */
const uniqueNamer = (): ((base: string) => string) => {
  const used = new Set<string>();
  return (base) => {
    let name = base;
    let n = 2;
    while (used.has(name)) {
      name = `${base}-${n}`;
      n += 1;
    }
    used.add(name);
    return name;
  };
};

const sourceContext = (
  context: ProjectContext,
  name: string,
  mode: "dev" | "build"
): SourceContext => ({
  cacheDir: join(context.outDir, "cache", name),
  mode,
  projectRoot: context.root,
});

const buildSource = (
  def: ContentSourceConfig,
  name: string,
  context: ProjectContext,
  mode: "dev" | "build"
): ContentSource => {
  if (def.type === "filesystem") {
    return filesystemSource({
      exclude: def.exclude,
      include: def.include,
      name,
      prefix: def.prefix,
      projectRoot: context.root,
      root: def.root,
    });
  }
  return mdxRemoteSource(
    {
      files: def.files,
      github: def.github,
      include: def.include,
      name,
      prefix: def.prefix,
      url: def.url,
    },
    sourceContext(context, name, mode)
  );
};

/**
 * Build the ordered list of content sources for a project. With no
 * `content.sources` configured, the top-level `root`/`include`/`exclude` desugar
 * to a single implicit filesystem source, so existing projects are untouched.
 */
export const resolveSources = (
  config: ResolvedConfig,
  context: ProjectContext,
  mode: "dev" | "build"
): ContentSource[] => {
  const defs = config.content.sources;
  if (!defs || defs.length === 0) {
    return [
      filesystemSource({
        exclude: config.content.exclude,
        include: config.content.include,
        name: "filesystem",
        projectRoot: context.root,
        root: config.content.root,
      }),
    ];
  }

  const nameFor = uniqueNamer();
  return defs.map((def) =>
    buildSource(def, nameFor(def.prefix ?? def.type), context, mode)
  );
};
