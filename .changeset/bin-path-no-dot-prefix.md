---
"blume": patch
---

Declare the `blume` bin as `bin/blume.mjs` instead of `./bin/blume.mjs`. The leading `./` is redundant and some package managers normalize it away when linking the binary; dropping it keeps the published manifest consistent with what installers actually write.
