---
"blume": patch
---

Fix code blocks inside `<Tabs>` and `<CodeGroup>` rendering flush against the panel edge with no horizontal padding. The code layout rule (padding, block display, horizontal scroll) opts out of not-prose subtrees for the API/Component panes that own their layout, but the Tabs chrome is also wrapped in not-prose — so code in a tab panel lost its inset and inline-collapsed. A companion rule restores the standard code layout inside a `blume-tabs` wrapper, where the panel is real prose content.
