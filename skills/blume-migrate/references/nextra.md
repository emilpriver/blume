# Nextra → Blume

Nextra (on Next.js) declares navigation and per-page labels in `_meta.{js,ts,json}` files — and crucially, **a folder's title and its pages' sidebar labels live in the _parent_ `_meta`**. Reconciling that cross-file inheritance is the main task.

## Detect

- A **`content/`** dir (Nextra 4 / App Router) or a **`pages/`** dir (Nextra ≤3), containing `.md`/`.mdx`.
- **`_meta.{js,mjs,cjs,ts,jsx,tsx,json}`** files — the strongest fingerprint.
- `nextra` + `next` deps; a `theme.config.{js,jsx,ts,tsx}` and `next.config.*`.

## Config

Nextra's site config lives in `theme.config.*` / `next.config.*`. **Read them by hand** — none of it maps automatically:

- Site `title`, `logo`, `favicon`, colors, `docsRepositoryBase` (→ `github`), footer, banner, search, i18n — reconstruct each in `blume.config.ts`.
- Root `_meta` entries with **`type: "page"`** → `navigation.tabs` (`{ label, path }`, where `path` is `/` for `index`, else `/<slug>`). `type: "page"` only maps at the **root**.

## Navigation: `_meta` → `meta.ts` + frontmatter

For each `_meta` entry (`key` = slug, value = string title or `{ title, type, display, href }`):

| Nextra `_meta` entry | Blume |
| --- | --- |
| ordinary page/folder (string or `{ title }`) | slug → parent `meta.ts` `pages` (ordering). A **page** title → that page's frontmatter `sidebar.label`. A **folder** title → that child folder's `meta.ts` `title` (title lives in the parent!). |
| `display: "hidden"` on a page | frontmatter `sidebar.hidden: true` |
| `type: "separator"` | drop → recreate as a group folder / `meta.ts` boundary if needed |
| `type: "menu"` (navbar dropdown) | drop → recreate via `navigation.selectors` if wanted |
| `href` (external link) | drop → add via a Header override |
| `type: "page"` (subfolder, not root) | drop (only root → tabs) |

Write each folder's `meta.ts` with its `pages` order (from its own `_meta`) and its `title` (inherited from the parent's `_meta`).

## Frontmatter

Nextra's core frontmatter (`title`, `description`) passes through. Inject `sidebar.label`/`sidebar.hidden` from the parent `_meta` (explicit frontmatter wins). Drop any non-schema key and report it.

## Components

- **Callouts:** `<Callout type="x">` → directive. `default`→`:::note`, `info`→`:::info`, `warning`→`:::warning`, `error`→`:::danger`. Bare `<Callout>`→`:::note`. `title` → `:::type[Title]`; drop `emoji`/`icon`.
- **Convert to Blume equivalents** (the old codemod left these for manual review — you should convert them):
  - `<Cards>`/`<Cards.Card>` → `<CardGroup>`/`<Card>`.
  - `<Tabs items={[…]}>`/`<Tabs.Tab>` → `<Tabs>`/`<Tab title="…">` (move labels from the parent `items` onto each `<Tab>`).
  - `<Steps>` → `<Steps>`/`<Step title>` (or a numbered list).
  - `<FileTree>`/`<FileTree.Folder>`/`<FileTree.File>` → `<FileTree>` (list-driven) or `<Tree>`/`<Tree.Folder>`/`<Tree.File>`.
  - `<Bleed>` (full-bleed) → no equivalent; drop the wrapper and report.
  - `<Table>` → a plain Markdown table.
- Strip `import … from "nextra"`/`"nextra/*"` lines.

## Icons

Nextra `_meta` icons aren't structured for Lucide and the codemod dropped them. Reconstruct icons yourself: set `sidebar.icon` / `meta.ts` `icon` / tab `icon` to Lucide names where the source had meaningful icons.

## Package.json & teardown

Repoint `dev`/`build`/`start` scripts to the Blume CLI; remove `next`/`nextra` deps by hand and add `blume`. Delete `next.config.*` and `theme.config.*` once verified.

## Dropped — report these

Whole `theme.config`/`next.config` surface (title, logo, colors, footer, banner, search, i18n — reconstruct); `_meta` separators, menus, external links, `newWindow`; `<Bleed>`; icons from `_meta`.
