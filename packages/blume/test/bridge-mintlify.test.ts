import { afterAll, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { dirname, join } from "pathe";

import { detectMintlifyBridge } from "../src/core/bridge.ts";
import { loadConfig } from "../src/core/config.ts";
import { scanProject } from "../src/core/project-graph.ts";
import { mintlifySource } from "../src/core/sources/mintlify.ts";

const dirs: string[] = [];

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

const makeProject = async (files: Record<string, string>): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "blume-bridge-"));
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

const DOCS_JSON = JSON.stringify({
  colors: { primary: "#16A34A" },
  name: "Garden",
  navigation: {
    groups: [{ group: "Guides", pages: ["index", "guides/intro"] }],
  },
  variables: { product: "Acme" },
});

// A page that exercises every transform branch: surviving frontmatter, a
// callout, a native component, a global variable, a `user` reference, and an
// unsupported component.
const PAGE_WITH_FRONTMATTER = `---
title: Intro
sidebarTitle: Getting started
---

<Note>Welcome to {{product}}.</Note>

<Card title="Hello">Hi {user.name}</Card>

<ParamField path="id" type="string">The id.</ParamField>
`;

// A page with no frontmatter (the empty-data branch) and a typed callout.
const PAGE_WITHOUT_FRONTMATTER = "<Tip>Pro tip.</Tip>\n";

describe("detectMintlifyBridge", () => {
  it("returns null when no Mintlify config is present", async () => {
    const root = await makeProject({ "index.mdx": "# Hi\n" });
    expect(await detectMintlifyBridge(root)).toBeNull();
  });

  it("synthesizes a Blume config with a mintlify content source", async () => {
    const root = await makeProject({ "docs.json": DOCS_JSON });
    const bridge = await detectMintlifyBridge(root);

    expect(bridge?.tool).toBe("mintlify");
    expect(bridge?.configFile).toBe(join(root, "docs.json"));
    expect(bridge?.raw.title).toBe("Garden");
    expect(bridge?.raw.theme?.accent).toBe("#16A34A");
    // Globals move onto the source; the top-level copy is dropped.
    expect(bridge?.raw.variables).toBeUndefined();

    const sources = bridge?.raw.content?.sources ?? [];
    expect(sources).toHaveLength(1);
    const [source] = sources;
    expect(source?.type).toBe("mintlify");
    if (source?.type === "mintlify") {
      expect(source.root).toBe(".");
      expect(source.configFile).toBe(join(root, "docs.json"));
      expect(source.variables).toStrictEqual({ product: "Acme" });
      expect(source.exclude).toContain("snippets/**");
    }
  });

  it("falls back to mint.json", async () => {
    const root = await makeProject({
      "mint.json": JSON.stringify({ name: "Legacy" }),
    });
    const bridge = await detectMintlifyBridge(root);
    expect(bridge?.configFile).toBe(join(root, "mint.json"));
    expect(bridge?.raw.title).toBe("Legacy");
  });

  it("serves referenced root-level asset dirs in place via content.assets", async () => {
    const root = await makeProject({
      "docs.json": JSON.stringify({
        logo: { dark: "/logo/dark.svg", light: "/logo/light.svg" },
        name: "Garden",
      }),
      "images/create.png": "png",
      "index.mdx": "# Hi\n",
      "logo/light.svg": "<svg/>",
    });
    const bridge = await detectMintlifyBridge(root);
    // `/images` (conventional) and the logo dir exist on disk, so both mount.
    expect(bridge?.raw.content?.assets).toContain("images");
    expect(bridge?.raw.content?.assets).toContain("logo");
  });

  it("omits content.assets entries that don't exist on disk", async () => {
    const root = await makeProject({
      "docs.json": JSON.stringify({ name: "Garden" }),
      "index.mdx": "# Hi\n",
    });
    const bridge = await detectMintlifyBridge(root);
    // No `images/` dir was created, so nothing is mounted.
    expect(bridge?.raw.content?.assets ?? []).toStrictEqual([]);
  });

  it("maps languages to i18n and drops the language selector", async () => {
    const root = await makeProject({
      "docs.json": JSON.stringify({
        name: "Docs",
        navigation: {
          // Pages give each language a path, so Mintlify would build a language
          // selector — which the bridge must strip in favor of Blume i18n.
          languages: [
            { default: true, language: "en", pages: ["index"] },
            { language: "fr", pages: ["fr/index"] },
          ],
        },
      }),
    });
    const bridge = await detectMintlifyBridge(root);
    expect(bridge?.raw.i18n?.defaultLocale).toBe("en");
    expect(bridge?.raw.i18n?.locales).toHaveLength(2);
    const selectors = bridge?.raw.navigation?.selectors ?? [];
    expect(selectors.some((s) => s.kind === "language")).toBe(false);
  });
});

describe("loadConfig bridge activation", () => {
  it("activates bridge mode from docs.json with no blume.config", async () => {
    const root = await makeProject({ "docs.json": DOCS_JSON });
    const result = await loadConfig(root);

    expect(result.bridge).toStrictEqual({
      configFile: join(root, "docs.json"),
      tool: "mintlify",
    });
    expect(result.configFile).toBe(join(root, "docs.json"));
    expect(result.config.content.sources?.[0]?.type).toBe("mintlify");
  });

  it("lets an explicit blume.config take precedence", async () => {
    const root = await makeProject({
      "blume.config.mjs": 'export default { title: "Mine" };\n',
      "docs.json": DOCS_JSON,
    });
    const result = await loadConfig(root);

    expect(result.bridge).toBeNull();
    expect(result.config.title).toBe("Mine");
    expect(result.config.content.sources).toBeUndefined();
  });
});

const sourceFor = (root: string, exclude: string[] = []) =>
  mintlifySource({
    configFile: join(root, "docs.json"),
    exclude,
    include: ["**/*.{md,mdx}"],
    name: "mintlify",
    projectRoot: root,
    root: ".",
    variables: { product: "Acme" },
  });

describe("mintlifySource", () => {
  it("transforms Mintlify MDX to Blume idiom and forces mdx", async () => {
    const root = await makeProject({
      "docs.json": DOCS_JSON,
      "guides/intro.mdx": PAGE_WITHOUT_FRONTMATTER,
      "index.mdx": PAGE_WITH_FRONTMATTER,
    });
    const { diagnostics, entries } = await sourceFor(root).load();

    const index = entries.find((entry) => entry.ref === "index.mdx");
    expect(index?.body.format).toBe("mdx");
    expect(index?.body.text).toContain(":::note");
    // {{product}} is inlined from docs.json variables.
    expect(index?.body.text).toContain("Welcome to Acme.");
    expect(index?.body.text).toContain("<Card");
    // Frontmatter was normalized (sidebarTitle -> sidebar.label) and restringified.
    expect(index?.raw).toContain("sidebar:");
    expect(index?.sourcePath).toBe(join(root, "index.mdx"));

    const intro = entries.find((entry) => entry.ref === "guides/intro.mdx");
    expect(intro?.body.text).toContain(":::tip");

    // ParamField has no Blume equivalent — warn, leave as-is.
    expect(diagnostics.map((d) => d.code)).toContain(
      "BLUME_MINTLIFY_UNSUPPORTED"
    );
  });

  it("emits no unsupported diagnostic for clean content", async () => {
    const root = await makeProject({
      "docs.json": DOCS_JSON,
      "index.mdx": PAGE_WITHOUT_FRONTMATTER,
    });
    const { diagnostics } = await sourceFor(root).load();
    expect(diagnostics).toHaveLength(0);
  });

  it("excludes snippets and honors extra ignores", async () => {
    const root = await makeProject({
      "docs.json": DOCS_JSON,
      "drafts/wip.mdx": "<Tip>wip</Tip>\n",
      "index.mdx": PAGE_WITHOUT_FRONTMATTER,
      "snippets/note.mdx": "shared\n",
    });
    const { entries } = await sourceFor(root, ["drafts/**"]).load();
    const refs = entries.map((entry) => entry.ref).toSorted();
    expect(refs).toStrictEqual(["index.mdx"]);
  });

  it("re-reads a single entry through the same transform", async () => {
    const root = await makeProject({
      "docs.json": DOCS_JSON,
      "index.mdx": PAGE_WITHOUT_FRONTMATTER,
    });
    const text = await sourceFor(root).read?.("index.mdx");
    expect(text).toContain(":::tip");
  });

  it("validates the content root exists", async () => {
    const root = await makeProject({ "docs.json": DOCS_JSON });
    expect(() => sourceFor(root).validate?.()).not.toThrow();

    const missing = mintlifySource({
      exclude: [],
      include: ["**/*.mdx"],
      name: "mintlify",
      projectRoot: join(root, "nope"),
      root: ".",
      variables: {},
    });
    expect(() => missing.validate?.()).toThrow(/Content root not found/u);
  });

  it("watches the content root and config file, returning a disposer", async () => {
    const root = await makeProject({
      "docs.json": DOCS_JSON,
      "index.mdx": PAGE_WITHOUT_FRONTMATTER,
    });
    const dispose = sourceFor(root).watch?.(() => {
      // no-op; we only assert the watcher wires up and disposes cleanly.
    });
    expect(typeof dispose).toBe("function");
    dispose?.();

    // Missing root and no config file: the disposer is still callable.
    const idle = mintlifySource({
      exclude: [],
      include: ["**/*.mdx"],
      name: "mintlify",
      projectRoot: join(root, "nope"),
      root: ".",
      variables: {},
    }).watch?.(() => {
      // no-op
    });
    expect(() => idle?.()).not.toThrow();
  });
});

describe("scanProject bridge e2e", () => {
  it("serves a Mintlify project end-to-end", async () => {
    const root = await makeProject({
      "docs.json": DOCS_JSON,
      "guides/intro.mdx": "---\ntitle: Intro\n---\n\n<Tip>Hi</Tip>\n",
      "index.mdx": "# Home\n",
    });
    const project = await scanProject(root);

    expect(project.bridge?.tool).toBe("mintlify");
    expect(project.config.title).toBe("Garden");
    const routes = project.manifest.routes
      .map((route) => route.path)
      .toSorted();
    expect(routes).toStrictEqual(["/", "/guides/intro"]);
    // The sidebar is driven by docs.json navigation groups.
    expect(JSON.stringify(project.graph.navigation.sidebar)).toContain(
      "Guides"
    );
  });
});
