# Blume — TODO

## P1 — Partially implemented (customization / override API, plan 05 / 16)

- [ ] `defineComponents({ islands })` group — currently silently dropped (only `mdx` + `layout` are read)
- [ ] Honor hydration descriptors (`.client` / `.media`) on layout-slot overrides — a React override renders with no `client:*`
- [ ] Resolve string-path component references (e.g. `Footer: "./components/footer.astro"`)
- [ ] Expose the missing overridable layout slots: `Layout`, `Logo`, `MobileNav`, `Search`, `Footer`, `PageHeader`, `PageFooter` (only 5 of ~12 wired today)
- [ ] `blume/runtime` data helpers: `getBlumeCollection`, `<BlumePage>`
- [ ] React island hooks: `useBlume()`, `usePage()`, `useSearch()`, `useAskAI()`
- [ ] Export per-component prop types (`import type { CalloutProps } from "blume/components"`)
- [ ] Friendly diagnostic when an override targets a framework component with no hydration mode

---

## P2 — Concrete smaller gaps

### Registry `blume add` (plan 05 / 07)

- [ ] Ship all the prebuilt components as registry items beyond the 5 layout components: `feedback`, `code-group` in case users want to edit them and wire them back in using `components.ts`.

### Errors & diagnostics (plan 18)

- [ ] Dev overlay (Blume diagnostics bridged into Vite/Astro overlay with snippet + fix + docs link)
- [ ] Remap `.blume/` stack frames back to user source
- [ ] Missing-component diagnostic (unknown MDX tag → suggest `blume add`)
- [ ] Hydration-mismatch diagnostic
- [ ] Line/column on config + frontmatter errors (`diagnosticsFromZod` sets file/schemaPath but not line/column)
- [ ] Populate `docsUrl` on diagnostics (field is formatted but never set)
- [ ] `--json` diagnostics output for CI/editors
- [ ] Stable internal-error contract (code + version dump) instead of raw re-throws

### CLI flags (plan 02)

- [ ] `init`: `--template docs|api|sdk|changelog`, `--package-manager`, `--eject`
- [ ] `dev`: `--content-dir`, `--debug`
- [ ] `build`: `--output static|server`, `--adapter`, `--base`, `--analyze`

### Navigation (plan 06)

- [ ] Render `navigation.selectors` (validates + builds into the graph but no component consumes it)
- [ ] Nav diagnostics: missing pages referenced in config, duplicate labels at a level, hidden pages referenced by pagination
- [ ] Validate icon names against the icon sets

### Deployment (plan 19)

- [ ] Emit platform redirect files (`_redirects` / `vercel.json`) + a redirect manifest for hosts needing manual wiring
- [ ] Env-var fail-fast when a feature needs a secret (AI Gateway token, analytics keys, feedback creds)

### Config (plan 04)

- [ ] Resolve orphan config fields (favicon/navbar/footer/icons/contextual/styling/banner) — prune or wire

### Content types & meta (plan 15 / 17)

- [ ] `toc` config in blume.config.ts (`toc: true` shorthand + `{ minHeadingLevel, maxHeadingLevel }`)

---

## P3 — Tooling & quality (plan 13 / 14)

- [ ] Fixture matrix (static/server deploy, broken links, invalid frontmatter, nested nav, custom `.astro`, React island, migration samples)
- [ ] Playwright e2e (nav, mobile sidebar, search modal, tabs/accordions, theme toggle, code copy, Ask AI shell, custom pages)
- [ ] Visual regression tests + automated accessibility checks (axe, focus trap, contrast, reduced motion)
- [ ] Performance-budget tooling (budgets are documented, not measured)
