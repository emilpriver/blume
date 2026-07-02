---
"blume": minor
---

Add React island hooks, importable from `blume/hooks`:

- `useBlume()` — the site `config` + `navigation`.
- `usePage()` — the current page's `route` + `title`.
- `useSearch()` — query the configured search provider (`search`, `results`,
  `loading`); the provider client loads lazily on first use.
- `useAskAI()` — stream answers from the grounded Ask AI endpoint (`ask`,
  `messages`, `loading`, `reset`).

Islands hydrate independently, so `useBlume`/`usePage` read a compact JSON
snapshot the layout serializes into the page (emitted only when the project ships
React, so static sites pay nothing). Custom pages built with `PageLayout` opt in
by passing a `clientData` prop.
