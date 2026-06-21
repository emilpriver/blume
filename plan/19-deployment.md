# 19 — Deployment

How a Blume site ships: what `blume build` emits, how output mode is chosen, env &
secrets, and per-platform presets. Builds on the output decision (resolved 09-B2)
and the server-only Ask AI decision (resolved 09-Z).

## Output modes (recap)

`config.output: "auto"` (default) picks per detected features:

- **`static`** — pure static export (Next `output: "export"`). Emits HTML/JS/CSS +
  the Pagefind index + `llms.txt`/raw `.md` + RSS/Atom feeds + sitemap/robots.
  Hostable on any CDN/static host, zero infra.
- **`server`** — Next **standalone** Node server. Used when a **server feature** is
  present.

`auto` chooses `static` unless a server feature is detected; force with
`output: "static" | "server"`.

### What requires `server`
- **Ask AI** (`ai.askAI.enabled`) — server-only by design (09-Z); its route holds
  the provider key.
- Any future runtime/dynamic feature.

### What does NOT require server (stays static)
- **Changelog from GitHub Releases** (09-AM) — fetched at **build time**, baked in.
- llms.txt / raw `.md` / copy / open-in-LLM, search, feeds, git metadata,
  structured data, feedback widget (emits analytics events client-side).

## What `blume build` emits

| Mode | Output | Served by |
| --- | --- | --- |
| static | `.blume/out/` (static site + search index + feeds + llms.txt) | any static host / CDN |
| server | Next standalone (`.blume/.next/standalone` + static assets) | `blume start` (Node) |

The build logs the chosen mode and **why** (e.g. "server: `ai.askAI` enabled").
`blume start` serves the standalone server; for static, any static file server works.

## Environment & secrets

Two distinct classes — keep them separate:

- **Build-time / public** — read during build, may end up in client output:
  `GITHUB_TOKEN` (changelog fetch + git metadata rate limits), public analytics keys,
  `config.variables`, SEO values. Baked into the build.
- **Runtime / server-only secrets** — read on the server at request time, **never**
  shipped to the client and **never** `NEXT_PUBLIC_*`: the **AI provider key**
  (e.g. `ANTHROPIC_API_KEY`) used by the Ask AI route (09-Z).

Notes:
- Enabling Ask AI means a **server deploy** + the provider key in the server env.
- `.env` lives per-package, not at the repo root (Turborepo best practice,
  [13-tooling.md](./13-tooling.md)); `blume doctor` lists required env vars.

## Platform presets

| Platform | static | server / Ask AI | Notes |
| --- | :---: | :---: | --- |
| **Vercel** | ✅ | ✅ (Functions/Edge) | Zero-config framework preset detects Blume; per-PR preview deploys |
| **Netlify** | ✅ | ✅ (Netlify Functions) | Static publish dir or Next runtime for server |
| **Cloudflare Pages** | ✅ | ✅ (Pages Functions, edge runtime) | Ask AI route runs on Workers |
| **Node / Docker** | ✅ | ✅ | `blume build` + `blume start`; Dockerfile shipped |
| **Static hosts** (GitHub Pages, S3/CloudFront, any CDN) | ✅ | ❌ | static only — Ask AI unavailable |

**Ask AI route** is a Next Route Handler (`app/api/ask/route.ts` in the generated
app). It deploys as a serverless/edge function on Vercel/Netlify/Cloudflare and is
served by the Node process in standalone mode. On pure static hosts there's no
function, so Ask AI is simply off (all other AI features still ship).

Blume publishes a **Vercel framework preset** so `vercel deploy` is zero-config;
other platforms get a short guide + the standalone server / static `out/` as needed.

## Subpath, URLs, redirects, headers

- **Base path** — deploy under a subdirectory via `config.basePath` (e.g. `/docs`);
  links and assets respect it.
- **Trailing slash** — `config.trailingSlash` (default clean URLs, no trailing slash).
- **Redirects** — `config.redirects` ([04](./04-configuration.md)) emit as **Next
  redirects** in server mode and as **platform redirect files** in static mode
  (`vercel.json`, Netlify/Cloudflare `_redirects`), with a meta-refresh fallback.
- **Headers/caching** — hashed assets served immutable; HTML revalidated. Platform
  adapters set sane defaults.

## Images

- **Static mode:** `next/image` optimization needs no server, so Blume runs the
  build-time image step (precompute sizes) / `unoptimized` + optional custom loader
  — the static-export image strategy tracked in [14-quality.md](./14-quality.md).
- **Server mode:** full `next/image` on-demand optimization is available.

## CI & previews

- Build only what changed: `turbo run build --affected` ([13](./13-tooling.md)).
- Deploy the `out/` (static) or standalone artifact.
- Per-PR **preview deploys** via the platform (Vercel/Netlify/Cloudflare native);
  CI gate runs `ultracite check` + tests ([14](./14-quality.md)).

## Private / authenticated docs

v1 is **host-level**: Vercel password protection, Cloudflare Access, or a reverse
proxy. Built-in auth (password/SSO) is post-1.0 and implies server mode
([14-quality.md](./14-quality.md)).

## Deploy targets summary

- **Just docs, zero infra** → `static` → any CDN (cheapest, simplest).
- **Docs + Ask AI** → `server` → Vercel/Netlify/Cloudflare/Node.
- **Self-host** → `blume build` (server) + `blume start`, or the shipped Dockerfile.
