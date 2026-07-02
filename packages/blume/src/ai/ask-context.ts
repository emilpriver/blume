import { buildOramaIndex, queryOramaIndex } from "../search/orama-index.ts";
import type { OramaDoc } from "../search/orama-index.ts";

/** A chat message as posted by the Ask AI island (`{ role, content }`). */
export interface AskMessage {
  content: string;
  role: string;
}

/** The current-page hint the island forwards so the endpoint can prioritize it. */
export interface AskPage {
  path?: string;
}

/**
 * The self-contained snapshot the grounded Ask AI endpoint imports. Bundles the
 * search documents so retrieval works regardless of the configured search
 * provider and needs no filesystem access at request time. Serialized to
 * `generated/ask-data.json` and built by {@link buildAskData}.
 */
export interface AskData {
  documents: OramaDoc[];
  site: string | null;
}

/** Documents retrieved per question and injected into the system prompt. */
const MAX_RESULTS = 6;
/** Characters kept per injected excerpt. */
const EXCERPT_CHARS = 1500;
/** Overall cap on injected documentation characters. */
const CONTEXT_BUDGET = 8000;

/**
 * The grounding preamble. The model is told to answer strictly from the injected
 * excerpts and to cite the pages it used, so answers stay tied to the docs.
 */
const BASE_INSTRUCTION =
  "You are a helpful documentation assistant for this project. Answer the user's question using ONLY the documentation excerpts below. If the answer is not covered by them, say you don't know and suggest where in the docs to look — do not invent details. Cite the page titles you drew from.";

/** Normalize a page path to a document `route` (`/`, `/a/b`, no trailing slash). */
const normalizeRoute = (input: string): string => {
  const noTrailing = input.trim().replace(/\/+$/u, "");
  const withSlash = noTrailing.startsWith("/") ? noTrailing : `/${noTrailing}`;
  return withSlash === "" ? "/" : withSlash;
};

/** The most recent non-empty user message, used as the retrieval query. */
const lastUserMessage = (messages: AskMessage[]): string => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === "user" && message.content?.trim()) {
      return message.content.trim();
    }
  }
  return "";
};

/** Trim a document body to `max` characters, marking truncation with an ellipsis. */
const excerpt = (content: string, max: number): string => {
  const trimmed = content.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
};

/**
 * Build the request-time grounding function for the Ask AI endpoint.
 *
 * Lexical retrieval over Orama (the same index/ranking the search dialog and MCP
 * server use). The index is built once and memoized across requests. Returns a
 * grounded system prompt — the retrieved excerpts plus the page the user is
 * viewing — or `undefined` when there is nothing to ground on, so the endpoint
 * can fall back to its plain prompt.
 */
export const createAskContext = (
  data: AskData
): ((
  messages: AskMessage[],
  page?: AskPage
) => Promise<string | undefined>) => {
  let dbPromise: Promise<Awaited<ReturnType<typeof buildOramaIndex>>> | null =
    null;
  const index = () => {
    dbPromise ??= buildOramaIndex(data.documents);
    return dbPromise;
  };
  const byRoute = new Map(data.documents.map((doc) => [doc.route, doc]));

  return async (messages, page) => {
    const list = Array.isArray(messages) ? messages : [];
    const query = lastUserMessage(list);
    if (!query) {
      return;
    }

    // The current page anchors retrieval to its locale and is injected first.
    const current = page?.path
      ? byRoute.get(normalizeRoute(page.path))
      : undefined;
    const db = await index();
    const hits = await queryOramaIndex(
      db,
      query,
      MAX_RESULTS,
      current?.locale || undefined
    );

    const seen = new Set<string>();
    const sections: string[] = [];
    let budget = CONTEXT_BUDGET;
    const push = (doc: OramaDoc, label: string) => {
      if (seen.has(doc.route) || budget <= 0) {
        return;
      }
      seen.add(doc.route);
      const body = excerpt(doc.content, Math.min(EXCERPT_CHARS, budget));
      budget -= body.length;
      sections.push(`## ${doc.title} (${doc.route})${label}\n${body}`);
    };

    if (current) {
      push(current, " — the page the user is currently viewing");
    }
    for (const hit of hits) {
      push(hit, "");
    }

    if (sections.length === 0) {
      return;
    }
    return `${BASE_INSTRUCTION}\n\n<docs>\n${sections.join("\n\n")}\n</docs>`;
  };
};
