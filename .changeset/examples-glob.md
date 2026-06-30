---
"blume": patch
---

Let `<Component>`'s `examples` config be a glob, not just a directory. When it contains glob magic (`*`, `?`, `[]`, `{}`, or `!`), only matching files are discovered and a `<Component path>` key is relative to the glob's static prefix. This lets a shadcn-style registry that colocates each component's source (named exports, no default) with its example (default export) be targeted directly — e.g. `examples: "registry/<pkg>/**/examples/*"` previews just the examples instead of sweeping in the sources and failing the build with `"default" is not exported`. Also makes `blume eject` honor the configured `examples` directory, which it previously ignored.
