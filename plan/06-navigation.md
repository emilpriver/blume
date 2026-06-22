# Navigation

## Goals

Navigation should work without manual configuration, but allow precise control for larger docs.

Blume needs:

- generated sidebars
- tabs/top-level sections
- page order
- groups
- links
- hidden pages
- versioned docs
- API reference sections
- breadcrumbs
- previous/next pagination

## Sources

Navigation is derived from:

1. file system
2. folder meta files
3. page frontmatter
4. `blume.config.ts`

## File-system defaults

```txt
docs/
  index.mdx
  getting-started.mdx
  guides/
    index.mdx
    deploy.mdx
```

Default nav:

- Introduction
- Getting Started
- Guides
  - Overview
  - Deploy

## Folder meta

Supported files:

```txt
docs/guides/_meta.json
docs/guides/_meta.yaml
```

Example:

```json
{
  "title": "Guides",
  "order": 2,
  "icon": "BookOpen",
  "pages": ["index", "deploy", "customization"]
}
```

## Page frontmatter

```yaml
---
title: Deploy
description: Deploy Blume docs to Vercel.
sidebar:
  label: Deployment
  order: 3
  icon: Rocket
---
```

## Config navigation

```ts
navigation: {
  tabs: [
    {
      label: "Docs",
      path: "/",
    },
    {
      label: "API",
      path: "/api",
    },
  ],
  sidebar: [
    "index",
    {
      label: "Guides",
      items: ["guides/deploy", "guides/customization"],
    },
  ],
}
```

## Icons

Icon inputs should support:

- Lucide icon names
- built-in Blume icon names
- component overrides
- no icon

Use serializable names in frontmatter and component references in config/overrides.

## Ordering rules

Order priority:

1. explicit config order
2. `_meta` page list
3. frontmatter `sidebar.order`
4. file-system order
5. title sort only if configured

File-system order should support numeric prefixes:

```txt
01-introduction.mdx
02-installation.mdx
```

The URL should omit numeric prefixes by default.

## Hidden pages

```yaml
---
sidebar:
  hidden: true
---
```

Hidden pages:

- still build
- still have URLs
- can optionally be excluded from search
- are not included in previous/next pagination

## Versioned docs

Potential convention:

```txt
docs/
  v1/
  v2/
```

Config:

```ts
versions: {
  current: "v2",
  versions: ["v2", "v1"],
}
```

Versioning can be post-v1, but the nav graph should not make it hard later.

## Diagnostics

Navigation diagnostics should catch:

- missing pages referenced in nav config
- duplicate routes
- duplicate labels at same level
- hidden pages referenced by pagination
- invalid icon names
- impossible version config
