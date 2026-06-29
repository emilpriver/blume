import { afterAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { dirname, join } from "pathe";

import { migrateNextra } from "../src/migrate/migrate.ts";
import { rewriteNextraCallouts } from "../src/migrate/nextra/content.ts";
import {
  parseNextraMeta,
  toBlumeFolderMeta,
} from "../src/migrate/nextra/meta.ts";

const dirs: string[] = [];

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

const project = async (files: Record<string, string>): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "blume-nextra-"));
  dirs.push(root);
  await Promise.all(
    Object.entries(files).map(async ([rel, content]) => {
      const abs = join(root, rel);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, content);
    })
  );
  return root;
};

describe("parseNextraMeta", () => {
  it("parses a JSON meta with string and object entries", () => {
    const entries = parseNextraMeta(
      JSON.stringify({
        guides: { title: "Guides", type: "menu" },
        index: "Home",
      }),
      ".json"
    );
    const bySlug = new Map(entries?.map((entry) => [entry.slug, entry]));
    expect(bySlug.get("index")?.title).toBe("Home");
    expect(bySlug.get("guides")?.type).toBe("menu");
  });

  it("parses a JS string map preserving order", () => {
    const entries = parseNextraMeta(
      `export default {\n  index: "Home",\n  "getting-started": "Get Started",\n};\n`,
      ".js"
    );
    expect(entries?.map((entry) => entry.slug)).toEqual([
      "index",
      "getting-started",
    ]);
    expect(entries?.[1]?.title).toBe("Get Started");
  });

  it("parses a JS object entry with type, href, and newWindow", () => {
    const entries = parseNextraMeta(
      `export default {\n  external: { title: "Docs", type: "page", href: "https://example.com", newWindow: true },\n};\n`,
      ".ts"
    );
    const entry = entries?.[0];
    expect(entry?.title).toBe("Docs");
    expect(entry?.type).toBe("page");
    expect(entry?.href).toBe("https://example.com");
    expect(entry?.newWindow).toBe(true);
  });

  it("keeps order but flags entries with an expression value", () => {
    const entries = parseNextraMeta(
      `export default {\n  index: <Icon />,\n  about: "About",\n};\n`,
      ".tsx"
    );
    expect(entries?.[0]?.slug).toBe("index");
    expect(entries?.[0]?.unparseable).toBe(true);
    expect(entries?.[1]?.title).toBe("About");
  });

  it("ignores comments between entries", () => {
    const entries = parseNextraMeta(
      `export default {\n  index: "Home",\n  // a top-nav link\n  contact: { type: "page" },\n};\n`,
      ".js"
    );
    expect(entries?.map((entry) => entry.slug)).toEqual(["index", "contact"]);
    expect(entries?.[1]?.type).toBe("page");
  });

  it("returns null when no object literal is found", () => {
    expect(parseNextraMeta("export const meta = 1;\n", ".js")).toBeNull();
  });
});

describe("toBlumeFolderMeta", () => {
  it("orders pages and routes titles, separators, and external links", () => {
    const conversion = toBlumeFolderMeta(
      [
        {
          slug: "---",
          title: "Section",
          type: "separator",
          unparseable: false,
        },
        { slug: "intro", title: "Intro", unparseable: false },
        { slug: "guides", title: "Guides", unparseable: false },
        {
          href: "https://example.com",
          slug: "ext",
          title: "External",
          unparseable: false,
        },
      ],
      {
        hasDir: (slug) => slug === "guides",
        hasPage: (slug) => slug === "intro",
      }
    );

    expect(conversion.folderMeta.pages).toEqual(["intro", "guides"]);
    expect(conversion.pageLabels.intro).toBe("Intro");
    expect(conversion.folderTitles.guides).toBe("Guides");
    expect(conversion.warnings.some((w) => w.includes("separator"))).toBe(true);
    expect(conversion.warnings.some((w) => w.includes("External"))).toBe(true);
  });
});

describe("rewriteNextraCallouts", () => {
  it("maps Callout types onto Blume directives", () => {
    expect(rewriteNextraCallouts('<Callout type="info">Hello</Callout>')).toBe(
      ":::info\nHello\n:::"
    );
    expect(rewriteNextraCallouts("<Callout>Hi</Callout>")).toBe(
      ":::note\nHi\n:::"
    );
    expect(rewriteNextraCallouts('<Callout type="error">Bad</Callout>')).toBe(
      ":::danger\nBad\n:::"
    );
  });
});

describe("migrateNextra end to end", () => {
  it("moves pages, converts _meta files, and maps top-nav pages", async () => {
    const root = await project({
      "pages/_meta.js": `export default {\n  index: "Home",\n  "getting-started": "Get Started",\n  guides: "Guides",\n  contact: { title: "Contact", type: "page" },\n  secret: { display: "hidden" },\n};\n`,
      "pages/getting-started.mdx":
        '---\ntitle: GS\n---\n\n<Callout type="warning">Careful</Callout>\n',
      "pages/guides/_meta.json": JSON.stringify({
        advanced: "Advanced Stuff",
        intro: "Intro",
      }),
      "pages/guides/advanced.mdx": "# Advanced\n",
      "pages/guides/intro.mdx": "# Intro\n",
      "pages/index.mdx": "# Home\n",
      "pages/secret.mdx": "# Secret\n",
    });

    const result = await migrateNextra(root);

    expect(result.moved).toBe(5);

    // Root meta orders visible pages (hidden + type:page excluded).
    const rootMeta = await readFile(join(root, "docs", "meta.ts"), "utf-8");
    expect(rootMeta).toContain('import { defineMeta } from "blume"');
    expect(rootMeta).toContain('"getting-started"');
    expect(rootMeta).not.toContain('"secret"');

    // Subfolder meta carries the order from its own _meta and the title from
    // the parent _meta.
    const guidesMeta = await readFile(
      join(root, "docs", "guides", "meta.ts"),
      "utf-8"
    );
    expect(guidesMeta).toContain('"title": "Guides"');
    expect(guidesMeta).toContain('"intro"');

    // String titles become sidebar labels; hidden becomes sidebar.hidden.
    const started = await readFile(
      join(root, "docs", "getting-started.mdx"),
      "utf-8"
    );
    expect(started).toContain("label: Get Started");
    expect(started).toContain(":::warning");
    const secret = await readFile(join(root, "docs", "secret.mdx"), "utf-8");
    expect(secret).toContain("hidden: true");

    // type:"page" entries become navigation tabs.
    const config = await readFile(join(root, "blume.config.ts"), "utf-8");
    expect(config).toContain('"label": "Contact"');
    expect(config).toContain('"path": "/contact"');
    expect(config).toContain('"title": "Documentation"');

    // Source _meta files are consumed.
    expect(existsSync(join(root, "pages", "_meta.js"))).toBe(false);
    expect(existsSync(join(root, "pages", "guides", "_meta.json"))).toBe(false);
  });

  it("detects the Nextra 4 content/ directory", async () => {
    const root = await project({
      "content/_meta.json": JSON.stringify({ index: "Home" }),
      "content/index.mdx": "# Home\n",
    });

    const result = await migrateNextra(root);
    expect(result.moved).toBe(1);
    expect(existsSync(join(root, "docs", "index.mdx"))).toBe(true);
    expect(existsSync(join(root, "docs", "meta.ts"))).toBe(true);
  });

  it("writes a default config when no Nextra content dir exists", async () => {
    const root = await project({ "README.md": "# Hi\n" });
    const result = await migrateNextra(root);
    expect(result.moved).toBe(0);
    const config = await readFile(join(root, "blume.config.ts"), "utf-8");
    expect(config).toContain('"title": "Documentation"');
  });
});
