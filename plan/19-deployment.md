# Deployment

## Goals

Blume should deploy cleanly as static docs by default and support server features when needed.

Primary target:

- static `dist/` output

First-class server target:

- Vercel through `@astrojs/vercel`

Other targets should follow Astro adapter support.

## Output modes

### Static

```ts
deployment: {
  output: "static",
}
```

Build:

```bash
blume build
```

Output:

```txt
dist/
```

Static mode supports:

- docs pages
- custom static pages
- local search
- sitemap
- RSS/changelog outputs
- `llms.txt`
- prerendered OG images if configured

### Server

```ts
deployment: {
  output: "server",
  adapter: "vercel",
}
```

Server mode supports:

- everything in static mode
- Ask AI endpoint
- dynamic OG images
- authenticated docs
- feedback persistence
- request-aware middleware
- Astro actions/endpoints

## Vercel

Vercel should be the most polished deployment path.

Support:

- `@astrojs/vercel`
- static output for simple docs
- server output for dynamic features
- Vercel Analytics
- Speed Insights
- AI SDK through Vercel AI Gateway
- optional Blob/Edge Config integrations where useful

Blume should avoid requiring Vercel for static docs.

## Adapters

Supported adapter config:

```ts
deployment: {
  output: "server",
  adapter: "node",
}
```

Potential adapters:

- `vercel`
- `node`
- `netlify`
- `cloudflare`

Adapter support should be documented with a compatibility matrix.

## Redirects

Config:

```ts
redirects: [
  { from: "/old", to: "/new", status: 301 },
]
```

Static mode:

- emit platform files where supported
- emit manifest for hosts that need manual wiring

Server mode:

- Astro middleware or endpoint handling

## Images and OG

Images:

- Astro assets for local images
- public assets for pass-through files
- remote images only through explicit allowlist/config

OG:

- static builds can prerender known route images
- server builds can expose a dynamic endpoint
- Vercel can use `@vercel/og` or Satori-compatible rendering

## Search deploy

Pagefind flow:

1. Astro builds HTML.
2. Blume runs Pagefind against `dist/`.
3. Search assets are copied into output.
4. Search island loads the local index.

Server mode should still support static search assets unless a hosted provider is configured.

## Environment variables

Server features may require env vars.

Examples:

- `VERCEL_OIDC_TOKEN` for Vercel AI Gateway in Vercel environments
- analytics keys
- feedback storage credentials

Build should fail fast for required env vars when a feature is enabled.

## Preview

`blume preview`:

- serves static `dist/` for static builds
- delegates to adapter preview for server builds where possible

## Deployment diagnostics

Build should explain:

- selected output mode
- selected adapter
- server-only features
- search provider
- generated redirects
- generated sitemap
- missing env vars
- incompatible config
