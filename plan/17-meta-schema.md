# Meta schema

## Goals

Blume metadata should be easy to write, strongly validated, and useful across nav, SEO, search, and AI outputs.

## Page frontmatter

```yaml
---
title: Installation
description: Install Blume in your project.
sidebar:
  label: Install
  order: 2
  icon: Download
seo:
  title: Install Blume
  image: /og/install.png
toc: true
search:
  exclude: false
---
```

## Core fields

| Field | Type | Purpose |
| --- | --- | --- |
| `title` | `string` | Page title |
| `description` | `string` | Page summary |
| `type` | `string` | Content type |
| `slug` | `string` | Override generated slug |
| `draft` | `boolean` | Exclude from production builds |

## Sidebar

```yaml
sidebar:
  label: Install
  order: 2
  icon: Download
  hidden: false
```

## SEO

```yaml
seo:
  title: Install Blume
  description: Fast docs on Astro and Vite.
  image: /og/install.png
  canonical: https://blume.dev/docs/install
  noindex: false
```

## TOC

```yaml
toc:
  minHeadingLevel: 2
  maxHeadingLevel: 3
```

Shorthand:

```yaml
toc: false
```

## Search

```yaml
search:
  exclude: true
  boost: 0.5
  tags:
    - api
```

## API

```yaml
api:
  method: POST
  path: /v1/messages
  auth: bearer
```

## Changelog

```yaml
changelog:
  date: 2026-06-21
  version: 1.2.0
  category: added
```

## Folder meta

```yaml
title: Guides
order: 2
icon: BookOpen
pages:
  - index
  - deploy
  - customization
```

## Validation

Validation should:

- report unknown keys with suggestions
- coerce safe shorthands
- reject ambiguous values
- include file path and line/column when possible
- produce normalized metadata for the graph

## Schema exports

Export schemas for integrations:

```ts
import { pageMetaSchema, folderMetaSchema } from "blume/schema";
```

This lets migration tools and editor integrations share the same validation logic.
