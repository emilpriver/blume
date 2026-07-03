---
"blume": patch
---

Fix code blocks rendering flush against the edge (no horizontal padding, inline, unscrollable) inside content components — `<Steps>`, `<Callout>`/`:::note`, `<Card>`, `<Accordion>`, `<Expandable>`, `<Panel>`, `<Update>`, `<Tabs>`, and `<CodeGroup>`. The rule that gives code blocks their inset opted out of every `not-prose` subtree, but only the API request panel actually owns its own code layout — every other component wraps its chrome in `not-prose` while still hosting real prose content. The exclusion now targets just the API panel, so code keeps its standard padding everywhere else. The Component source pane and API request panel are unchanged.
