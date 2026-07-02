"use client";

import { loadFont as loadIBMPlexMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import type { ReactNode } from "react";

import { ICON_BASH, ICON_TS } from "@/scenes/code-icons";

// A faithful, static port of apps/docs/pages/_home/ProductPreview.astro — the
// fictional "Comet" docs site built with Blume. Fonts, colors, Shiki
// (github-light) code highlighting, and layout mirror the live site so the
// browser preview reads as the real thing. Exported as a sticky header + a
// scrolling body so the caller can pin the header while the page scrolls.

const { fontFamily: INTER } = loadInter("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600"],
});
const { fontFamily: INTER_TIGHT } = loadInterTight("normal", {
  subsets: ["latin"],
  weights: ["500", "600"],
});
const { fontFamily: MONO } = loadIBMPlexMono("normal", {
  subsets: ["latin"],
  weights: ["400", "500"],
});

// Resolved Blume docs theme tokens (oklch → hex).
const FG = "#0a0a0a";
const MUTED = "#6f6f6f";
const BORDER = "#e1e3e5";
const ACCENT = "#009696";
const CALLOUT_BG = "#e0f4f5";
const CALLOUT_BORDER = "#b2e5e5";

/** Rendered geometry of the docs site (a 1280-wide virtual layout). */
export const DOCS_WIDTH = 1280;
export const DOCS_HEADER_H = 56;
export const DOCS_SIDEBAR_W = 232;
export const DOCS_TOC_W = 210;
export const DOCS_CONTENT_W = 700;

// Shiki github-light token palette.
const SH = {
  comment: "#6a737d",
  constant: "#005cc5",
  fn: "#6f42c1",
  keyword: "#d73a49",
  string: "#032f62",
  text: "#24292e",
};

const SPARK =
  "M12 1.5l2.45 6.4a3 3 0 0 0 1.65 1.65L22.5 12l-6.4 2.45a3 3 0 0 0-1.65 1.65L12 22.5l-2.45-6.4a3 3 0 0 0-1.65-1.65L1.5 12l6.4-2.45a3 3 0 0 0 1.65-1.65z";

const SIDEBAR = [
  {
    items: ["Introduction", "Quickstart", "Authentication", "SDKs"],
    label: "Get started",
  },
  {
    items: ["Messages", "Templates", "Batches", "Scheduling", "Attachments"],
    label: "Sending",
  },
  { items: ["Domains", "Webhooks", "Suppressions"], label: "Deliverability" },
  { items: ["API keys", "Rate limits", "Errors"], label: "Reference" },
];
const ACTIVE = "Quickstart";

const ON_THIS_PAGE = [
  { label: "Install the SDK", sub: false },
  { label: "Authenticate", sub: false },
  { label: "Send a message", sub: false },
  { label: "Use a template", sub: true },
  { label: "Send in bulk", sub: false },
  { label: "Track delivery", sub: false },
  { label: "Handle webhooks", sub: true },
  { label: "Handle errors", sub: false },
  { label: "Rate limits", sub: false },
  { label: "Next steps", sub: false },
];

const CLIENT_CODE = `import { Comet } from "comet";

export const comet = new Comet(process.env.COMET_API_KEY);`;

const SEND_CODE = `const { id } = await comet.messages.send({
  to: "ada@example.com",
  template: "welcome",
});

console.log(\`Queued \${id}\`);`;

const BATCH_CODE = `const results = await comet.messages.batch([
  { to: "ada@example.com", template: "welcome" },
  { to: "grace@example.com", template: "welcome" },
]);

console.log(\`Queued \${results.length} messages\`);`;

const ERROR_CODE = `try {
  await comet.messages.send({ to, template });
} catch (err) {
  if (err instanceof CometError) {
    console.error(err.status, err.message);
  }
}`;

const WEBHOOK_CODE = `app.post("/webhooks/comet", (req, res) => {
  const event = comet.webhooks.verify(req);

  if (event.type === "message.delivered") {
    markDelivered(event.data.id);
  }

  res.sendStatus(200);
});`;

interface Seg {
  text: string;
  color: string;
}

const KEYWORDS = new Set([
  "import",
  "from",
  "export",
  "const",
  "let",
  "var",
  "await",
  "new",
  "return",
  "if",
  "else",
  "for",
  "of",
  "while",
  "async",
  "function",
]);

const highlightTs = (line: string): Seg[] => {
  const segs: Seg[] = [];
  const re =
    /(?<comment>\/\/[^\n]*)|(?<str>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?<num>\b\d[\w.]*)|(?<ident>[A-Za-z_$][\w$]*)|(?<space>\s+)|(?<punct>[^\s\w$])/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const [tok, comment, str, num, ident, space] = m;
    if (comment) {
      segs.push({ color: SH.comment, text: tok });
    } else if (str) {
      segs.push({ color: SH.string, text: tok });
    } else if (num) {
      segs.push({ color: SH.constant, text: tok });
    } else if (space) {
      segs.push({ color: SH.text, text: tok });
    } else if (ident) {
      const next = line[re.lastIndex];
      let color = SH.text;
      if (KEYWORDS.has(ident)) {
        color = SH.keyword;
      } else if (next === "(") {
        color = SH.fn;
      }
      segs.push({ color, text: tok });
    } else {
      segs.push({ color: SH.text, text: tok });
    }
  }
  return segs;
};

const highlightBash = (line: string): Seg[] => {
  const words = line.split(" ");
  const segs: Seg[] = [];
  for (const [i, w] of words.entries()) {
    if (i > 0) {
      segs.push({ color: SH.text, text: " " });
    }
    let color = SH.text;
    if (i === 0 && /^(?<pm>npm|npx|pnpm|yarn|bun)$/u.test(w)) {
      color = SH.fn;
    } else if (i === 1) {
      color = SH.string;
    }
    segs.push({ color, text: w });
  }
  return segs;
};

const LangIcon = ({ lang }: { lang: "ts" | "bash" }) => (
  <svg
    width={15}
    height={15}
    viewBox="0 0 24 24"
    fill={MUTED}
    aria-hidden="true"
  >
    <path d={lang === "bash" ? ICON_BASH : ICON_TS} />
  </svg>
);

// The Lucide "copy" glyph, matching the docs' copy button (`copyIcon`).
const CopyIcon = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#a8a29e"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x={8} y={8} width={14} height={14} rx={2} ry={2} />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width={15}
    height={15}
    viewBox="0 0 24 24"
    fill="none"
    stroke={MUTED}
    strokeWidth={2}
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx={11} cy={11} r={8} />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const GithubIcon = () => (
  <svg
    width={19}
    height={19}
    viewBox="0 0 16 16"
    fill={MUTED}
    aria-hidden="true"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const SunIcon = () => (
  <svg
    width={17}
    height={17}
    viewBox="0 0 24 24"
    fill="none"
    stroke={MUTED}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx={12} cy={12} r={4} />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const LightbulbIcon = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke={ACCENT}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5A5 5 0 1 0 7.5 11.5c.8.8 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6M10 21h4" />
  </svg>
);

const CodeBlock = ({
  title,
  code,
  lang,
}: {
  title: string;
  code: string;
  lang: "ts" | "bash";
}) => {
  const lines = code.split("\n");
  const hl = lang === "bash" ? highlightBash : highlightTs;
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        marginTop: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          justifyContent: "space-between",
          padding: "9px 14px",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <LangIcon lang={lang} />
          <span style={{ color: MUTED, fontFamily: MONO, fontSize: 13 }}>
            {title}
          </span>
        </div>
        <CopyIcon />
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 13,
          lineHeight: "21px",
          padding: "14px 16px",
          whiteSpace: "pre",
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ minHeight: 21 }}>
            {hl(line).map((s, j) => (
              <span key={j} style={{ color: s.color }}>
                {s.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const H2 = ({ children }: { children: string }) => (
  <div
    style={{
      color: FG,
      fontFamily: INTER,
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: "-0.02em",
      marginTop: 40,
    }}
  >
    {children}
  </div>
);

const H3 = ({ children }: { children: string }) => (
  <div
    style={{
      color: FG,
      fontFamily: INTER,
      fontSize: 15,
      fontWeight: 500,
      letterSpacing: "-0.01em",
      marginTop: 32,
    }}
  >
    {children}
  </div>
);

const P = ({ children, small }: { children: ReactNode; small?: boolean }) => (
  <p
    style={{
      color: MUTED,
      fontFamily: INTER,
      fontSize: small ? 14 : 16,
      lineHeight: 1.62,
      margin: `${small ? 12 : 16}px 0 0`,
    }}
  >
    {children}
  </p>
);

const InlineCode = ({ children }: { children: string }) => (
  <code
    style={{
      background: "#f3f3f3",
      borderRadius: 4,
      color: FG,
      fontFamily: MONO,
      fontSize: "0.82em",
      padding: "1px 5px",
    }}
  >
    {children}
  </code>
);

// The docs top bar — rendered pinned by the caller so it stays put on scroll.
export const DocsHeader = () => (
  <div
    style={{
      alignItems: "center",
      background: "#fff",
      borderBottom: `1px solid ${BORDER}`,
      boxSizing: "border-box",
      color: FG,
      display: "flex",
      fontFamily: INTER,
      height: DOCS_HEADER_H,
      justifyContent: "space-between",
      padding: "0 22px",
      width: DOCS_WIDTH,
    }}
  >
    <div style={{ alignItems: "center", display: "flex", gap: 26 }}>
      <span
        style={{
          alignItems: "center",
          color: FG,
          display: "flex",
          fontSize: 17,
          fontWeight: 500,
          gap: 8,
        }}
      >
        <svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill={ACCENT}
          aria-hidden="true"
        >
          <path d={SPARK} />
        </svg>
        Comet
      </span>
      <nav
        style={{
          alignItems: "center",
          color: MUTED,
          display: "flex",
          fontSize: 15,
          gap: 20,
        }}
      >
        <span style={{ color: FG }}>Docs</span>
        <span>API</span>
        <span>Changelog</span>
      </nav>
    </div>
    <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
      <span
        style={{
          alignItems: "center",
          border: `1px solid ${BORDER}`,
          borderRadius: 999,
          color: MUTED,
          display: "flex",
          fontSize: 13,
          gap: 8,
          padding: "6px 12px",
        }}
      >
        <SearchIcon />
        Search
        <span
          style={{
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            fontFamily: MONO,
            fontSize: 12,
            marginLeft: 6,
            padding: "0 5px",
          }}
        >
          ⌘K
        </span>
      </span>
      <GithubIcon />
      <SunIcon />
    </div>
  </div>
);

// The left nav. Rendered as its own pane so the caller can pin / animate it.
export const DocsSidebar = () => (
  <div
    style={{
      background: "#fff",
      borderRight: `1px solid ${BORDER}`,
      boxSizing: "border-box",
      fontFamily: INTER,
      fontSize: 13.5,
      height: "100%",
      padding: 22,
      width: DOCS_SIDEBAR_W,
    }}
  >
    {SIDEBAR.map((group) => (
      <div key={group.label} style={{ marginBottom: 22 }}>
        <p style={{ color: FG, fontWeight: 500, margin: 0 }}>{group.label}</p>
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            listStyle: "none",
            margin: "12px 0 0",
            padding: 0,
          }}
        >
          {group.items.map((item) => (
            <li key={item} style={{ color: item === ACTIVE ? ACCENT : MUTED }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

// The Quickstart article. Fixed-width so it never reflows as it's repositioned.
export const DocsContent = () => (
  <div
    style={{
      background: "#fff",
      boxSizing: "border-box",
      color: FG,
      fontFamily: INTER,
      padding: "34px 40px",
      width: DOCS_CONTENT_W,
    }}
  >
    <div
      style={{
        color: FG,
        fontFamily: INTER_TIGHT,
        fontSize: 38,
        fontWeight: 500,
        letterSpacing: "-0.025em",
        lineHeight: 1.1,
      }}
    >
      Quickstart
    </div>
    <P>
      Send your first transactional message in minutes. Comet's REST API works
      with any language — this guide uses the official TypeScript SDK.
    </P>

    {/* tip callout */}
    <div
      style={{
        alignItems: "flex-start",
        background: CALLOUT_BG,
        border: `1px solid ${CALLOUT_BORDER}`,
        borderRadius: 8,
        color: "#33484a",
        display: "flex",
        fontSize: 14,
        gap: 10,
        lineHeight: 1.55,
        margin: "20px 0 0",
        padding: "13px 16px",
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        <LightbulbIcon />
      </span>
      <span>
        Store your API key in an environment variable — never commit it to
        source control.
      </span>
    </div>

    <H2>Install the SDK</H2>
    <P small>
      Add Comet to your project with your package manager of choice. The SDK
      ships with TypeScript types and runs on Node, Bun, and Deno.
    </P>
    <CodeBlock title="Terminal" lang="bash" code="npm install comet" />

    <H2>Authenticate</H2>
    <P small>
      Every request is authorized with a Bearer token. Read your key from{" "}
      <InlineCode>process.env</InlineCode> so it never touches version control.
    </P>
    <CodeBlock title="client.ts" lang="ts" code={CLIENT_CODE} />

    <H2>Send a message</H2>
    <P small>
      Call <InlineCode>messages.send</InlineCode> with a recipient and a
      template. Every request returns an id you can use to track delivery.
    </P>
    <CodeBlock title="send-message.ts" lang="ts" code={SEND_CODE} />

    <H3>Use a template</H3>
    <P small>
      Reference a template by slug and pass variables — Comet renders the
      subject and body server-side, so your app never ships copy.
    </P>

    <H2>Send in bulk</H2>
    <P small>
      Queue up to 500 messages in a single request with{" "}
      <InlineCode>messages.batch</InlineCode>. Each entry is validated and
      enqueued independently.
    </P>
    <CodeBlock title="batch.ts" lang="ts" code={BATCH_CODE} />

    <H2>Track delivery</H2>
    <P small>
      Poll the message endpoint, or subscribe to webhooks for real-time
      delivery, open, click, and bounce events as they happen.
    </P>

    <H3>Handle webhooks</H3>
    <P small>
      Verify the signature on each request, then react to the event — here we
      mark a message delivered in our own database.
    </P>
    <CodeBlock title="webhook.ts" lang="ts" code={WEBHOOK_CODE} />

    <H2>Handle errors</H2>
    <P small>
      Failed requests throw a typed <InlineCode>CometError</InlineCode> with the
      HTTP status and a readable message, so you can retry or log with
      confidence.
    </P>
    <CodeBlock title="errors.ts" lang="ts" code={ERROR_CODE} />

    <H2>Rate limits</H2>
    <P small>
      Every key is limited to 100 requests per second, and each response
      includes a remaining-quota header so you can throttle before you hit the
      ceiling.
    </P>
    <P small>
      Bursts above the limit return a 429, and the SDK retries them
      automatically with exponential backoff — so most callers never notice.
    </P>

    <H2>Next steps</H2>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontSize: 14,
        gap: 10,
        marginTop: 16,
      }}
    >
      {["Authentication", "Webhooks reference", "API reference"].map((step) => (
        <span
          key={step}
          style={{
            alignItems: "center",
            color: ACCENT,
            display: "inline-flex",
            fontWeight: 500,
            gap: 6,
          }}
        >
          {step}
          <span aria-hidden="true">→</span>
        </span>
      ))}
    </div>
  </div>
);

// The right-hand on-this-page rail.
export const DocsToc = () => (
  <div
    style={{
      background: "#fff",
      borderLeft: `1px solid ${BORDER}`,
      boxSizing: "border-box",
      fontFamily: INTER,
      fontSize: 13.5,
      height: "100%",
      padding: 22,
      width: DOCS_TOC_W,
    }}
  >
    <p style={{ color: FG, fontWeight: 500, margin: 0 }}>On this page</p>
    <ul
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 11,
        listStyle: "none",
        margin: "12px 0 0",
        padding: 0,
      }}
    >
      {ON_THIS_PAGE.map((item, i) => (
        <li
          key={item.label}
          style={{
            color: i === 0 ? FG : MUTED,
            paddingLeft: item.sub ? 12 : 0,
          }}
        >
          {item.label}
        </li>
      ))}
    </ul>
  </div>
);
