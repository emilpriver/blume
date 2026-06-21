# 00 — Vision & Positioning

## What Blume is

Blume is a documentation framework for the web. The author writes MDX files,
runs `blume dev`, and gets a complete, polished documentation site — navigation,
search, theming, dark mode, syntax highlighting — without writing any
application code. The framework constructs the Next.js app around the content at
dev/build time.

The difference from a hosted product: Blume is open source and **ejectable at the
component level**. Any element — from an `<h1>` in the markdown renderer to the
entire sidebar — can be replaced with your own React component via a single
`components.tsx` file.

## Who it's for

- **Teams who want Mintlify's "just write content" experience** but need to own
  their stack, self-host, or customize beyond what a hosted config allows.
- **Open-source projects** that want great docs without adopting and maintaining
  a full Next.js app.
- **Design-conscious teams** who will eventually want to override components and
  match their brand precisely.

## Positioning

| | Mintlify | Fumadocs | **Blume** |
| --- | --- | --- | --- |
| Get started | Drop MDX, hosted | Scaffold a Next.js app | **Drop MDX, run `blume dev`** |
| You manage a Next.js app? | No | Yes | **No (it's generated/hidden)** |
| Customization model | Config + limited theming | Own all the code | **Override any component via `components.tsx`** |
| Open source | No | Yes | **Yes** |
| Hosting | Hosted (paid) | Self-host anywhere | **Self-host anywhere** |
| Lock-in | High | None | **None (ejectable)** |

The wedge: **Mintlify-grade zero-config DX + Fumadocs-grade control, with no
hosting lock-in.**

## Principles

1. **Content is just files.** MDX in a folder. Git-friendly. No database, no CMS.
2. **Convention over configuration.** A folder of MDX renders beautifully with
   zero config. Configuration is additive, never required to start.
3. **Progressive disclosure of power.** The complexity ladder is opt-in:
   `nothing` → `blume.config.ts` → `components.tsx` → `theme.css` → deep overrides.
   You only meet the next rung when you need it.
4. **The framework owns the shell; you own the content.** And when you want it,
   you own the shell too — one component at a time, defaults intact for the rest.
5. **No lock-in.** Blume is open source (**MIT**). Overrides are plain React. There
   is a path to fully eject into a regular Next.js app.
6. **Beautiful by default.** The default theme should be good enough to ship as-is.
7. **Fast.** Static-first output, instant HMR in dev, minimal client JS.
8. **AI-native.** Docs are first-class context for LLMs — llms.txt, raw markdown,
   copy/open-in-LLM, and an optional Ask AI ship in the box ([11-ai.md](./11-ai.md)).

## Non-goals (initially)

- Being a general-purpose website builder. Blume is for **docs** — though an
  optional, first-class **landing/home page** is supported (resolved 09-U), it is
  not a full marketing-site system.
- A hosted/paid control plane, including **hosted AI inference**. Ask AI is
  bring-your-own-provider; the OSS framework is the core.
- Supporting non-MDX content sources at launch (CMS, Notion, etc. are later).
- Framework-agnostic rendering. Blume targets **Next.js (App Router)** under the
  hood. That's an implementation detail users shouldn't need to touch — but it's
  the substrate, not Vite/Astro/etc.

## The "aha" moment we're designing for

1. `npx blume init` → a folder with two MDX files and nothing else.
2. `blume dev` → a real, searchable, dark-mode docs site at localhost.
3. Add `components.tsx` with one override → that component changes everywhere,
   in both the chrome and the markdown, with no rebuild ceremony.

If those three steps feel magical, Blume wins.
