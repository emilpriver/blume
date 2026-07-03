---
"blume": patch
---

`theme.accent`, `theme.action`, and `theme.backgroundDecoration` now actually apply in dark mode. The base stylesheet's `:root[data-theme="dark"]` block outranked the `:root` config tokens on CSS specificity, so dark mode silently kept its neutral defaults — `accent: "teal"` gave a teal light mode and a near-white dark mode, contradicting the documented "light and dark share one accent". The generated config CSS now re-declares the mode-shared tokens (accent + foreground, action, background decoration) in a dark-scoped block; `accentDark` still takes precedence when set.
