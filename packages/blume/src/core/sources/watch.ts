import type { WatchListener } from "node:fs";

/**
 * Directory segments a recursive dev watcher must never react to. When a
 * source's content root is the project root — a migrated `.`-rooted project or a
 * Mintlify bridge — a naive recursive `fs.watch` also sees Blume's own `.blume/`
 * output, which the dev server rewrites on every render (e.g.
 * `.blume/.astro/data-store.json`). Left unfiltered, each such write re-triggers
 * a rescan + runtime regeneration whose writes land back under `.blume/` and
 * fire the watcher again: a self-sustaining loop that stalls page renders and
 * floods the console (and, mid-render, corrupts Astro's dev module graph so
 * `astro:server-app.js` fails to load). `.git`/`node_modules` are here for the
 * same reason — churn that is never page content. `fs.watch` has no ignore
 * option, so we filter by the changed path in the callback.
 */
export const BLUME_WATCH_IGNORE_DIRS = [".blume", ".git", "node_modules"];

/** Extract single-segment ignore dirs (`foo`) from `foo/**`-style excludes. */
export const excludeDirSegments = (patterns: readonly string[]): string[] =>
  patterns
    .map((pattern) => /^(?<dir>[^*/]+)\/\*\*$/u.exec(pattern)?.groups?.dir)
    .filter((dir): dir is string => dir !== undefined);

/**
 * Build a recursive-watch listener that fires `onChange` for content changes but
 * ignores events whose path crosses an ignored directory segment. A missing
 * `filename` — rare; the platform couldn't name the changed path — falls through
 * to `onChange` rather than silently dropping a real edit. Exported for testing.
 */
export const ignoringWatchListener = (
  onChange: () => void,
  ignoreDirs: Iterable<string> = BLUME_WATCH_IGNORE_DIRS
): WatchListener<string> => {
  const ignore = new Set(ignoreDirs);
  return (_event, filename) => {
    if (
      typeof filename === "string" &&
      filename.split(/[/\\]/u).some((segment) => ignore.has(segment))
    ) {
      return;
    }
    onChange();
  };
};
