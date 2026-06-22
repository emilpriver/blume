# Tooling

## Repository shape

Suggested monorepo:

```txt
packages/
  blume/
  create-blume/
  core/
  astro/
  mdx/
  components/
  theme/
  search/
  registry/
  migrate/
examples/
  basic/
  api-reference/
  custom-theme/
  ask-ai/
docs/
```

## Package manager

Use a popular, well-supported package manager with strong workspace support.

Preferred:

- Bun for speed if the project is already Bun-native
- pnpm if ecosystem compatibility becomes more important

The public CLI should work regardless of the user's package manager.

## Build system

Use Turborepo or a similarly well-supported workspace task runner for package builds, tests, and release tasks.

Astro and Vite are runtime/build dependencies for generated docs projects.

## TypeScript

Requirements:

- strict mode
- project references where useful
- no barrel-only `index.ts` files inside feature folders
- public exports explicit through package `exports`
- generated types for config and components

## Linting and formatting

Use the project's selected lint stack consistently.

Rules should cover:

- TypeScript
- Astro files
- MDX fixtures
- React islands
- tests

Avoid framework-specific lint presets that do not match the Astro/Vite runtime.

## Tests

Test layers:

- unit tests for core graph/config/schema
- integration tests for generated `.blume/`
- fixture builds with Astro
- Playwright tests for rendered docs
- visual tests for components
- migration snapshot tests

## Fixtures

Fixtures should include:

- basic docs
- nested nav
- MDX components
- custom `.astro` component
- React island component
- custom page
- static deploy
- server deploy
- broken links
- invalid frontmatter
- Mintlify migration sample
- Starlight migration sample
- Fumadocs migration sample

## Release

Release flow:

- changesets
- package provenance
- canary releases
- fixture build matrix before stable release
- generated runtime compatibility tests

## Examples

Examples should be runnable and deployed:

- minimal docs
- branded docs
- API reference
- AI docs
- component override
- ejected Astro app
