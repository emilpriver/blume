# Blume — Planning

Blume is an open-source framework for building documentation websites. You drop
MDX files in a folder, run `blume dev`, and Blume constructs and runs a Next.js
app around your content — you never write or maintain frontend/backend code. But
unlike a hosted product, **every component is yours to override**.

> Mintlify's DX. Fumadocs' control. Fully open source.

## How this plan is organized

Each file is a self-contained slice we can iterate on independently. Read them in
order for the full picture, or jump to the area you're working on.

| File | Topic |
| --- | --- |
| [00-vision.md](./00-vision.md) | What Blume is, who it's for, positioning vs Mintlify & Fumadocs, principles |
| [01-architecture.md](./01-architecture.md) | How `blume dev` constructs and runs the Next.js app; the runtime model; Blume's own repo layout |
| [02-cli.md](./02-cli.md) | `blume` CLI commands, flags, behavior |
| [03-content-pipeline.md](./03-content-pipeline.md) | File discovery, routing, frontmatter, MDX compilation, TOC, search index |
| [04-configuration.md](./04-configuration.md) | `blume.config.ts` — `defineConfig` schema |
| [05-customization.md](./05-customization.md) | `components.tsx` — `defineComponents`, overriding markdown + app-shell slots |
| [06-navigation.md](./06-navigation.md) | Sidebar, tabs, TOC, breadcrumbs, pager, search UX |
| [07-theming.md](./07-theming.md) | Design tokens, dark mode, styling strategy, `theme.css` |
| [08-roadmap.md](./08-roadmap.md) | Milestones from skeleton to 1.0 |
| [09-open-questions.md](./09-open-questions.md) | Decision log — 37 resolved; only `K` (loader) and `N` (eject contract) remain |
| [10-components.md](./10-components.md) | The component library — shadcn/ui-based, Mintlify+Fumadocs parity, override matrix |
| [11-ai.md](./11-ai.md) | AI-native features — llms.txt, raw markdown, copy/open-in-LLM, Ask AI (BYO provider) |
| [12-internals.md](./12-internals.md) | Concrete contracts — config types, registry, manifest schema, `.blume/` generator output |
| [13-tooling.md](./13-tooling.md) | Developing Blume itself — Turborepo, bun, tsgo, ultracite (oxlint/oxfmt) |
| [14-quality.md](./14-quality.md) | Testing, accessibility (WCAG 2.2 AA), release/changesets, and known technical constraints |
| [15-content-types.md](./15-content-types.md) | Custom React pages, content collections (blog/changelog), typed frontmatter, feeds |
| [16-component-api.md](./16-component-api.md) | Exact prop contracts for every stdlib component (the buildable "own API") |
| [17-meta-schema.md](./17-meta-schema.md) | The per-folder `meta.json` schema — nav ordering, groups, frontmatter defaults |
| [18-errors.md](./18-errors.md) | Error handling & the branded dev overlay — categories, severity, codes, UX |
| [19-deployment.md](./19-deployment.md) | Deploying — output modes, env/secrets, platform presets (Vercel/Netlify/CF/Node/static) |

## Status

The product shape, scope, defaults, and tooling are **settled** — see the decision
log in [09-open-questions.md](./09-open-questions.md) (37 resolved; only `K` config
loader and `N` eject contract remain, both minor). The plan is detailed enough to
build against; [12-internals.md](./12-internals.md) holds the concrete contracts.
Next natural step: scaffold **M0** ([08-roadmap.md](./08-roadmap.md)).

## The mental model in one diagram

```
User's project                         Blume (the framework)
──────────────                         ─────────────────────
content/**/*.mdx        ─┐
blume.config.ts          ├──►  blume dev  ──►  generates + runs a Next.js app
components.tsx           │                      (content source + app shell +
theme.css (optional)    ─┘                       merged component registry)
public/                                                  │
                                                         ▼
                                              http://localhost:3000
```

The user owns the left column. Blume owns everything on the right — and exposes
it for override.
