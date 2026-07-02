// Ambient types for Blume's generated virtual modules, so package sources that
// consume them (e.g. the island hooks importing `blume:search-client`) typecheck.
// This file is not part of the published `dist/types` (which is emitted only from
// the public entry points), so it can't leak into a consumer's typecheck; the
// generated `.blume/src/env.d.ts` declares the same module for that context.
//
// `import()` types (not a top-level `import`) keep this a global script, so the
// `declare module` stays an ambient declaration visible across the package.

declare module "blume:search-client" {
  /** Create the configured provider's query function (may be async to build). */
  // biome-ignore lint/style/useImportType: ambient module must stay a global script
  // oxlint-disable-next-line typescript/consistent-type-imports
  type Fn = import("./components/layout/search/types.ts").SearchFn;
  export const createSearch: () => Fn | Promise<Fn>;
}
