---
"blume": patch
---

Recognize `~~~` tilde code fences when extracting headings, links, and component tags, fixing false `BLUME_BROKEN_LINK`/`BLUME_UNKNOWN_COMPONENT` diagnostics and phantom heading anchors for tilde-fenced content (a ``` line inside a `~~~` fence no longer toggles the fence state either).
