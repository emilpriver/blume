---
"blume": patch
---

Link validation no longer flags Markdown link syntax shown inside inline code. Prose like ``use `[label](/page)` syntax`` registered `/page` as a real link, and since broken internal links are build errors, any page demonstrating link syntax failed `blume validate`. Inline code spans are now masked out (with column positions preserved) before link extraction, matching how component-tag extraction already behaves.
