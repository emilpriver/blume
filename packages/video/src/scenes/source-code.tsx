"use client";

// The MDX source for the Quickstart page — shown on the left of the split view,
// its rendered output (DocsContent) on the right. Light editor styling with
// github-light-ish markdown highlighting and IBM Plex Mono (matching the docs).

const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

const FG = "#24292e";
const COMMENT = "#6a737d";
const HEADING = "#005cc5";
const DIRECTIVE = "#009696";
const KEY = "#6f42c1";
const FENCE_INFO = "#22863a";
const INLINE = "#e36209";
// github-light for the embedded TS block
const TS = {
  constant: "#005cc5",
  fn: "#6f42c1",
  keyword: "#d73a49",
  string: "#032f62",
  text: "#24292e",
};

export const SOURCE_TITLE = "quickstart.mdx";

export const QUICKSTART_SOURCE = `---
title: Quickstart
---

Send your first transactional message in
minutes. Comet's REST API works with any
language — this guide uses the official
TypeScript SDK.

:::tip
Store your API key in an environment variable
— never commit it to source control.
:::

## Install the SDK

Add Comet to your project with your package
manager of choice.

\`\`\`package-install
comet
\`\`\`

## Authenticate

Every request is authorized with a Bearer
token. Read your key from \`process.env\` so it
stays out of version control.

\`\`\`ts client.ts
import { Comet } from "comet";

export const comet = new Comet(
  process.env.COMET_API_KEY,
);
\`\`\`

## Send a message

Call \`messages.send\` with a recipient and a
template. Each call returns an id you can use
to track delivery.

\`\`\`ts send-message.ts
const { id } = await comet.messages.send({
  to: "ada@example.com",
  template: "welcome",
});
\`\`\`

### Use a template

Reference a template by slug and pass
variables — Comet renders the subject and
body server-side.

## Send in bulk

Queue up to 500 messages in a single request
with \`messages.batch\`.

\`\`\`ts batch.ts
const results = await comet.messages.batch([
  { to: "ada@example.com", template: "welcome" },
  { to: "grace@example.com", template: "welcome" },
]);
\`\`\`

## Track delivery

Subscribe to webhooks for real-time delivery,
open, click, and bounce events.

### Handle webhooks

Verify the signature on each request, then
react to the event.

\`\`\`ts webhook.ts
app.post("/webhooks/comet", (req, res) => {
  const event = comet.webhooks.verify(req);
  if (event.type === "message.delivered") {
    markDelivered(event.data.id);
  }
  res.sendStatus(200);
});
\`\`\`

## Handle errors

Failed requests throw a typed \`CometError\`
with the HTTP status and a readable message.

\`\`\`ts errors.ts
try {
  await comet.messages.send({ to, template });
} catch (err) {
  if (err instanceof CometError) {
    console.error(err.status, err.message);
  }
}
\`\`\`

## Rate limits

Every key is limited to 100 requests per
second. Watch the \`X-RateLimit-Remaining\`
header to throttle before you hit the ceiling.`;

interface Seg {
  text: string;
  color: string;
  bold?: boolean;
}

const KEYWORDS = new Set([
  "import",
  "from",
  "const",
  "let",
  "await",
  "new",
  "return",
]);

const highlightTs = (line: string): Seg[] => {
  const segs: Seg[] = [];
  const re =
    /(?<str>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?<num>\b\d[\w.]*)|(?<ident>[A-Za-z_$][\w$]*)|(?<space>\s+)|(?<punct>[^\s\w$])/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const [tok, str, num, ident, space] = m;
    if (str) {
      segs.push({ color: TS.string, text: tok });
    } else if (num) {
      segs.push({ color: TS.constant, text: tok });
    } else if (space) {
      segs.push({ color: TS.text, text: tok });
    } else if (ident) {
      const next = line[re.lastIndex];
      let color = TS.text;
      if (KEYWORDS.has(ident)) {
        color = TS.keyword;
      } else if (next === "(") {
        color = TS.fn;
      }
      segs.push({ color, text: tok });
    } else {
      segs.push({ color: TS.text, text: tok });
    }
  }
  return segs;
};

// Split a prose line on inline `code` spans.
const highlightProse = (line: string): Seg[] => {
  const segs: Seg[] = [];
  const re = /`[^`]+`/gu;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      segs.push({ color: FG, text: line.slice(last, m.index) });
    }
    segs.push({ color: INLINE, text: m[0] });
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    segs.push({ color: FG, text: line.slice(last) });
  }
  return segs.length ? segs : [{ color: FG, text: line }];
};

const highlightMdx = (code: string): Seg[][] => {
  const lines = code.split("\n");
  let frontmatter = 0;
  let inFence: string | null = null;
  return lines.map((line) => {
    const isDelim = line.trim() === "---" && inFence === null;
    if (isDelim && frontmatter < 2) {
      frontmatter += 1;
      return [{ color: COMMENT, text: line }];
    }
    const fence = line.match(/^```(?<info>.*)$/u);
    if (fence) {
      if (inFence === null) {
        inFence = fence[1].split(" ")[0] || "txt";
        return [
          { color: COMMENT, text: "```" },
          { color: FENCE_INFO, text: fence[1] },
        ];
      }
      inFence = null;
      return [{ color: COMMENT, text: "```" }];
    }
    if (inFence) {
      return inFence === "ts" ? highlightTs(line) : [{ color: FG, text: line }];
    }
    if (frontmatter === 1) {
      const kv = line.match(/^(?<key>[\w-]+)(?<colon>:)(?<rest>.*)$/u);
      if (kv) {
        return [
          { color: KEY, text: kv[1] },
          { color: FG, text: kv[2] },
          { color: FG, text: kv[3] },
        ];
      }
      return [{ color: FG, text: line }];
    }
    if (/^#{1,6}\s/u.test(line)) {
      return [{ bold: true, color: HEADING, text: line }];
    }
    if (line.startsWith(":::")) {
      return [{ color: DIRECTIVE, text: line }];
    }
    return highlightProse(line);
  });
};

const LINES = highlightMdx(QUICKSTART_SOURCE);

export const SourceCode = ({ fontSize = 15 }: { fontSize?: number }) => {
  const lineHeight = Math.round(fontSize * 1.62);
  return (
    <div
      style={{
        background: "#fff",
        boxSizing: "border-box",
        height: "100%",
        padding: "26px 8px 26px 20px",
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize,
          lineHeight: `${lineHeight}px`,
          whiteSpace: "pre",
        }}
      >
        {LINES.map((segs, i) => (
          <div key={i} style={{ display: "flex", minHeight: lineHeight }}>
            <span
              style={{
                color: "#c4c8cd",
                flexShrink: 0,
                paddingRight: 18,
                textAlign: "right",
                userSelect: "none",
                width: 40,
              }}
            >
              {i + 1}
            </span>
            <span>
              {segs.map((s, j) => (
                <span
                  key={j}
                  style={{ color: s.color, fontWeight: s.bold ? 600 : 400 }}
                >
                  {s.text}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
