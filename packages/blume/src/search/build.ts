import { join } from "pathe";

/**
 * Build a local Pagefind search index over the built site. Pagefind only
 * indexes elements marked with `data-pagefind-body`, which Blume adds to the
 * content of indexable pages, so nav chrome and excluded pages are skipped.
 *
 * Returns the number of pages indexed.
 */
export const buildSearchIndex = async (outDir: string): Promise<number> => {
  const pagefind = await import("pagefind");

  const { index } = await pagefind.createIndex({});
  if (!index) {
    throw new Error("Failed to create Pagefind index.");
  }

  // These awaits are strictly ordered, not independent: the directory must be
  // indexed before its files are written, and the index closed only after.
  // oxlint-disable-next-line react-doctor/async-parallel
  const result = await index.addDirectory({ path: outDir });
  await index.writeFiles({ outputPath: join(outDir, "pagefind") });
  await pagefind.close();

  return result.page_count;
};
