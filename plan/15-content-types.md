# Content types

## Goal

Blume should understand common docs content types without forcing users into a CMS.

Initial content types:

- docs pages
- guides
- API reference
- changelog
- examples
- landing pages
- generated LLM files

## Docs pages

Default type:

```yaml
---
title: Installation
description: Install Blume.
---
```

Docs pages participate in:

- sidebar
- TOC
- search
- previous/next
- sitemap
- LLM output

## Guides

Guides are docs pages with stronger sequencing.

```yaml
---
type: guide
title: Deploy to Vercel
---
```

Potential guide features:

- prerequisites
- estimated time
- step validation
- related guides

## API reference

Sources:

- OpenAPI
- hand-authored MDX
- TypeScript extraction later

Example:

```yaml
---
type: api
method: GET
path: /v1/users
---
```

API pages should support:

- method/path display
- auth notes
- parameters
- request examples
- response schemas
- code samples

## Changelog

```yaml
---
type: changelog
date: 2026-06-21
version: 1.2.0
---
```

Changelog pages can render in:

- individual page
- changelog index
- RSS feed
- release notes JSON

## Examples

Examples can pair narrative docs with source links and previews.

```yaml
---
type: example
stack:
  - astro
  - vercel
---
```

## Landing pages

Landing pages should be `.astro` custom pages in v1.

```txt
pages/index.astro
pages/showcase.astro
```

They can import Blume layout pieces while retaining Astro-native flexibility.

## LLM outputs

Generated from the graph:

- `llms.txt`
- `llms-full.txt`
- page Markdown endpoints later

## Type inference

Content type schemas should be exported for users and integrations.

The internal graph should normalize all content types into route records plus type-specific metadata.
