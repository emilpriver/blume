---
"blume": patch
---

Ground **Ask AI** in your docs. The `/api/ask` endpoint now retrieves the most
relevant pages for each question — via the same lexical Orama index that powers
search — and injects them into the model's system prompt, so answers stay tied
to your content and cite the pages they draw from instead of relying on the
model's own knowledge. The in-page island also forwards the current page, which
is added to the context first and used to scope retrieval to that page's locale.
Grounding turns on automatically with Ask AI for the gateway, OpenRouter, and
OpenAI-compatible backends; **Inkeep** is left untouched since it runs its own
retrieval. No new configuration or dependencies.
