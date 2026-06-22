# Content pipeline

## Goals

Blume's content pipeline turns a folder of docs into a validated, routable, renderable graph for Astro.

It should support:

- Markdown and MDX as first-class content
- optional Markdoc-style authoring later
- inferred routes and navigation
- structured frontmatter
- custom components
- API reference content
- local search indexing
- static output by default

## Content roots

Default:

```txt
docs/
```

Optional:

```ts
import { defineConfig } from "blume";

export default defineConfig({
  content: {
    root: "content/docs",
  },
});
```

Supported file types:

- `.md`
- `.mdx`
- `.mdoc` or `.markdoc` later
- `.json` or `.yaml` for structured API/reference inputs

Custom pages should live separately:

```txt
pages/
  changelog.astro
  examples/[slug].astro
```

Framework components can be imported into MDX or `.astro` pages as islands, but v1 should not treat arbitrary `.tsx` files as route files.

## Route mapping

Default route rules:

| File | Route |
| --- | --- |
| `docs/index.mdx` | `/` |
| `docs/getting-started.mdx` | `/getting-started` |
| `docs/api/index.mdx` | `/api` |
| `docs/api/auth.mdx` | `/api/auth` |

Group folders are optional conventions:

| File | Route |
| --- | --- |
| `docs/(guides)/quickstart.mdx` | `/quickstart` |
| `docs/(internal)/security.mdx` | `/security` |

Group folders affect nav organization, not URL paths.

## Frontmatter pipeline

Steps:

1. parse frontmatter
2. validate with the Blume meta schema
3. normalize defaults
4. attach file-system metadata
5. attach route metadata
6. attach nav metadata
7. emit diagnostics

The normalized page record should include:

- `id`
- `sourcePath`
- `route`
- `title`
- `description`
- `sidebar`
- `toc`
- `seo`
- `contentType`
- `headings`
- `imports`
- `assets`

## Content graph

The graph should model:

- pages
- groups
- nav items
- headings
- links
- assets
- component usage
- API references
- redirects
- search records

This graph is the source of truth for generated Astro modules.

## Compilation

MDX compilation should happen through Blume's compiler layer and feed Astro/Vite modules.

Requirements:

- stable component mapping
- source maps where possible
- file/line diagnostics
- heading extraction
- code fence metadata extraction
- import validation
- static analysis of links and assets

Astro should render the final pages, but Blume should own the docs-specific interpretation of metadata, routes, components, and search records.

## Components in content

Built-ins:

```mdx
<Callout type="info">
  Ship the docs before the docs system ships you.
</Callout>

<Tabs>
  <Tab title="npm">npm install blume</Tab>
  <Tab title="bun">bun add blume</Tab>
</Tabs>
```

Component resolution order:

1. page-local imports
2. user overrides from `components.ts`
3. Blume built-ins
4. diagnostic error

Interactive framework components should require an island hydration strategy when rendered outside plain MDX server output.

## Assets

Supported asset locations:

- colocated with docs
- `public/`
- configured asset directories

Image handling:

- use Astro assets and image service where possible
- preserve plain Markdown image behavior for simple cases
- support remote images through explicit config
- emit diagnostics for missing or oversized assets

## Search records

Search indexing should derive from the compiled content graph and built HTML.

Each record should include:

- route
- title
- section heading
- body excerpt
- hierarchy
- tags
- content type

Default search should be local and static-friendly. Pagefind is the likely v1 baseline.

## Link validation

Validate:

- internal links
- hash links
- asset links
- redirects
- generated API reference anchors

Modes:

- warn in dev
- fail in `build --strict`
- configurable external link checks later
