---
"blume": patch
---

Documentation fixes:

- Restore collapsed `:::warning` / `:::note` callout directives to their multi-line form in the syntax guide, the FAQ, and the Blume agent skill
- FAQ: soften the oxfmt patch claim to "ships the same fix", include `:::info` in the list of affected container directives, and update the example patch to the shipped `oxfmt@0.58.0` version (which now also preserves titled directives like `:::warning[Heads up]`)
- AI guide: describe the MCP tool list without a hardcoded count, correct the `agent-readability.json` default-state wording, and drop the reference to the deferred migration skill
- i18n guide: describe UI translation packs as "over 30 languages" instead of a hardcoded count
- Quickstart and Deployment: require Node.js 22.12 or newer, matching the package engines
- Configuration reference: correct the `markdown` feature description (code blocks, heading anchors, image zoom), split the `toc` example into two valid snippets, and document the `github` option (owner, repo, branch, dir)
- Custom pages: update the `BlumeDataConfig` field list to include `ask`, `codeThemes`, and `toc`
- Skills guide: use the verified `npx skills add haydenbleasel/blume --skill blume-update-docs` install command
