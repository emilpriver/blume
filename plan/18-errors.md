# Errors and diagnostics

## Goals

Blume should make generated-runtime errors feel like user-source errors.

The user should not need to inspect `.blume/` to understand common failures.

## Diagnostic categories

- config
- content
- frontmatter
- navigation
- routing
- component override
- hydration
- asset
- link
- search
- deployment
- AI/server feature
- internal

## Diagnostic shape

```ts
type Diagnostic = {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  docsUrl?: string;
};
```

## CLI output

Example:

```txt
BLUME_FRONTMATTER_INVALID

docs/api/auth.mdx:4:10

sidebar.order must be a number.

Received:
  order: "first"

Fix:
  order: 1
```

## Dev overlay

Blume should integrate with Astro/Vite overlay output.

Overlay should show:

- user source path
- diagnostic code
- message
- snippet
- suggested fix
- link to docs

Generated stack frames should be collapsed when a clearer user diagnostic exists.

## Common errors

### Duplicate route

```txt
Two files resolve to /guides/deploy:

- docs/guides/deploy.mdx
- docs/(guides)/deploy.mdx
```

### Missing component

```txt
Unknown MDX component <APIPlayground> in docs/api/index.mdx.

Fix:
- import it in the page
- register it in components.ts
- install it with blume add api-playground
```

### Hydration mismatch

```txt
Component override "layout.Search" appears to be a framework component but no client hydration mode was configured.

Fix:
  Search: { component: Search, client: "load" }
```

### Static/server mismatch

```txt
Ask AI requires server output, but deployment.output is "static".

Fix:
  deployment: { output: "server", adapter: "vercel" }
```

### Missing adapter

```txt
Server output requires an Astro adapter.

Fix:
  deployment: { output: "server", adapter: "vercel" }
```

## `blume doctor`

Doctor should inspect:

- config
- content graph
- generated runtime
- package versions
- Astro/Vite compatibility
- adapter setup
- search output
- component overrides

Output should distinguish:

- errors that block build
- warnings that may matter
- informational checks

## JSON output

`--json` should emit diagnostics for editor integrations and CI.

```bash
blume build --json
```

## Internal errors

Internal errors should:

- include a short stable code
- ask for reproduction details
- include Blume/Astro/Vite versions
- avoid dumping private content by default
