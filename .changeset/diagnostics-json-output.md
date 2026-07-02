---
"blume": minor
---

Add `--json` to `blume validate` and `blume doctor`. With the flag, diagnostics
are emitted as a JSON document on stdout — each with `code`, `severity`,
`message`, root-relative `file`, `line`/`column`, and `docsUrl`, plus a severity
summary — for CI pipelines and editor integrations. Human output is suppressed so
stdout stays parseable.
