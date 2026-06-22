# Configuration

## File

Default config file:

```txt
blume.config.ts
```

Example:

```ts
import { defineConfig } from "blume";

export default defineConfig({
  title: "Blume",
  description: "Open-source docs powered by Astro and Vite.",
  content: {
    root: "docs",
  },
  theme: {
    accent: "teal",
  },
  deployment: {
    output: "static",
  },
});
```

## Loader

Config loading should:

- support TypeScript
- support ESM
- validate with Zod or a similar schema
- preserve type inference
- avoid running arbitrary runtime code more than necessary
- work outside the generated Astro project

`defineConfig` is primarily for type inference and future plugin hooks.

## Top-level shape

```ts
type BlumeConfig = {
  title?: string;
  description?: string;
  logo?: LogoConfig;
  content?: ContentConfig;
  navigation?: NavigationConfig;
  theme?: ThemeConfig;
  components?: ComponentsConfig;
  search?: SearchConfig;
  ai?: AIConfig;
  analytics?: AnalyticsConfig;
  deployment?: DeploymentConfig;
  redirects?: RedirectConfig[];
  integrations?: IntegrationConfig[];
};
```

## Config precedence

From lowest to highest:

1. Blume defaults
2. template defaults
3. `blume.config.ts`
4. folder meta files
5. page frontmatter
6. CLI flags

Every merge should be deterministic and explainable by diagnostics.

## Content config

```ts
content: {
  root: "docs",
  pages: "pages",
  include: ["**/*.{md,mdx}"],
  exclude: ["**/_*.mdx"],
  defaultType: "doc",
}
```

## Deployment config

```ts
deployment: {
  output: "static",
  adapter: "vercel",
  base: "/docs",
}
```

Rules:

- `static` uses Astro static output.
- `server` uses Astro server output and an adapter.
- server-only features should automatically suggest `output: "server"`.
- static builds should fail clearly when dynamic-only features are enabled.

## Search config

```ts
search: {
  provider: "pagefind",
  indexing: {
    includeHiddenPages: false,
  },
}
```

Future providers can include Algolia, Orama, or a hosted Blume-compatible API.

## AI config

```ts
ai: {
  ask: {
    enabled: true,
    model: "openai/gpt-4.1-mini",
  },
}
```

Default AI support should use the AI SDK with Vercel AI Gateway model strings. The runtime should fail fast with a clear server-side diagnostic when required gateway auth is missing.

## Analytics config

```ts
analytics: {
  vercel: true,
  posthog: {
    key: "phc_...",
    host: "https://us.i.posthog.com",
  },
}
```

Vercel Analytics and Speed Insights should be the lowest-friction path, but Blume should not block other scripts.

## Integrations

Integrations should be explicit:

```ts
integrations: [
  sitemap(),
  llmsTxt(),
  feedback(),
]
```

Internally, integrations can contribute:

- config schema
- content transforms
- route manifests
- Astro endpoints
- client islands
- build hooks
