import { afterAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

import { join } from "pathe";

import {
  blumeIntegration,
  showBlumeErrorOverlay,
} from "../src/astro/integration.ts";
import type { AssetMount } from "../src/core/assets.ts";
import { resolveAssetMounts } from "../src/core/assets.ts";
import type { Diagnostic } from "../src/core/types.ts";

const dirs: string[] = [];

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

const hooksOf = (assets: AssetMount[]) =>
  blumeIntegration({ assets, contentRoutes: [], pages: [] }).hooks;

const projectWithImage = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "blume-int-"));
  dirs.push(root);
  await mkdir(join(root, "images"), { recursive: true });
  await writeFile(join(root, "images", "a.png"), "bytes");
  return root;
};

describe("blumeIntegration content.assets", () => {
  it("copies asset mounts into the build output on astro:build:done", async () => {
    const root = await projectWithImage();
    const out = await mkdtemp(join(tmpdir(), "blume-int-out-"));
    dirs.push(out);

    const hooks = hooksOf(resolveAssetMounts(root, ["images"]));
    await hooks["astro:build:done"]?.({
      dir: pathToFileURL(`${out}/`),
    } as never);

    expect(existsSync(join(out, "images", "a.png"))).toBe(true);
  });

  it("registers a dev middleware that serves asset mounts", async () => {
    const root = await projectWithImage();
    const stack: { handle: unknown; route: string }[] = [];

    const hooks = hooksOf(resolveAssetMounts(root, ["images"]));
    hooks["astro:server:setup"]?.({
      server: { middlewares: { stack } },
    } as never);

    // The asset middleware is unshifted after the markdown one, so it's first.
    expect(stack).toHaveLength(2);
    const handle = stack[0]?.handle as (
      req: IncomingMessage,
      res: ServerResponse,
      next: () => void
    ) => void;

    let served = false;
    let nexted = false;
    const res = {
      emit: () => false,
      end: () => res,
      on: () => res,
      once: () => res,
      setHeader: () => {
        served = true;
      },
      write: () => true,
    };
    handle(
      { method: "GET", url: "/images/a.png" } as IncomingMessage,
      res as unknown as ServerResponse,
      () => {
        nexted = true;
      }
    );
    expect(served).toBe(true);
    expect(nexted).toBe(false);
  });

  it("registers no asset middleware when none are configured", () => {
    const stack: { handle: unknown; route: string }[] = [];
    const hooks = hooksOf([]);
    hooks["astro:server:setup"]?.({
      server: { middlewares: { stack } },
    } as never);
    // Only the markdown-negotiation middleware.
    expect(stack).toHaveLength(1);
  });
});

type MiddlewareStack = { handle: unknown; route: string }[];

interface OverlayPayload {
  err: { id?: string; message: string; plugin: string; stack: string };
  type: string;
}

/** Run `astro:server:setup` and return the resulting middleware stack. */
const serverSetup = (
  options: Partial<Parameters<typeof blumeIntegration>[0]> = {},
  server: Record<string, unknown> = {}
): MiddlewareStack => {
  const stack: MiddlewareStack = [];
  blumeIntegration({
    assets: [],
    contentRoutes: [],
    pages: [],
    ...options,
  }).hooks["astro:server:setup"]?.({
    server: { middlewares: { stack }, ...server },
  } as never);
  return stack;
};

type MiddlewareHandle = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => void;

/** The markdown-negotiation handle sits first when no asset mounts exist. */
const markdownHandle = (
  contentRoutes: string[],
  base?: string
): MiddlewareHandle =>
  serverSetup({ base, contentRoutes })[0]?.handle as MiddlewareHandle;

describe("blumeIntegration astro:config:setup", () => {
  it("injects each user page route as a prerendered route", () => {
    const injected: unknown[] = [];
    blumeIntegration({
      assets: [],
      contentRoutes: [],
      pages: [
        { entrypoint: "/abs/changelog.astro", pattern: "/changelog" },
        { entrypoint: "/abs/example.astro", pattern: "/examples/[slug]" },
      ],
    }).hooks["astro:config:setup"]?.({
      injectRoute: (route: unknown) => injected.push(route),
    } as never);

    expect(injected).toEqual([
      {
        entrypoint: "/abs/changelog.astro",
        pattern: "/changelog",
        prerender: true,
      },
      {
        entrypoint: "/abs/example.astro",
        pattern: "/examples/[slug]",
        prerender: true,
      },
    ]);
  });
});

describe("blumeIntegration markdown negotiation", () => {
  it("rewrites a content route to its .md variant when markdown is preferred", () => {
    const handle = markdownHandle(["/guide"]);
    const req = {
      headers: { accept: "text/markdown" },
      method: "GET",
      url: "/guide",
    } as unknown as IncomingMessage;
    const headers: Record<string, string> = {};
    let nexted = false;
    handle(
      req,
      {
        setHeader: (key: string, value: string) => {
          headers[key] = value;
        },
      } as unknown as ServerResponse,
      () => {
        nexted = true;
      }
    );

    expect(req.url).toBe("/guide.md");
    expect(headers.Vary).toBe("Accept");
    expect(nexted).toBe(true);
  });

  it("leaves the request untouched when the path is not a content route", () => {
    const handle = markdownHandle(["/guide"]);
    const req = {
      headers: { accept: "text/markdown" },
      method: "GET",
      url: "/not-a-page",
    } as unknown as IncomingMessage;
    let headerSet = false;
    let nexted = false;
    handle(
      req,
      {
        setHeader: () => {
          headerSet = true;
        },
      } as unknown as ServerResponse,
      () => {
        nexted = true;
      }
    );

    expect(req.url).toBe("/not-a-page");
    expect(headerSet).toBe(false);
    expect(nexted).toBe(true);
  });

  it("does not negotiate when the client does not prefer markdown", () => {
    const handle = markdownHandle(["/guide"]);
    const req = {
      headers: { accept: "text/html" },
      method: "GET",
      url: "/guide",
    } as unknown as IncomingMessage;
    let headerSet = false;
    let nexted = false;
    handle(
      req,
      {
        setHeader: () => {
          headerSet = true;
        },
      } as unknown as ServerResponse,
      () => {
        nexted = true;
      }
    );

    expect(req.url).toBe("/guide");
    expect(headerSet).toBe(false);
    expect(nexted).toBe(true);
  });
});

describe("showBlumeErrorOverlay", () => {
  it("pushes error diagnostics into the dev-server overlay channel", () => {
    let payload: OverlayPayload | undefined;
    serverSetup(
      {},
      {
        ws: {
          send: (p: unknown) => {
            payload = p as OverlayPayload;
          },
        },
      }
    );

    showBlumeErrorOverlay([
      {
        code: "BLUME_CONFIG_INVALID",
        docsUrl: "https://useblume.dev/custom",
        file: "blume.config.ts",
        line: 5,
        message: "bad config",
        severity: "error",
        suggestion: "set it right",
      },
    ]);

    expect(payload).toEqual({
      err: {
        id: "blume.config.ts",
        message:
          "Blume found 1 error(s):\n\n[BLUME_CONFIG_INVALID] bad config\n  at blume.config.ts:5\n  fix: set it right\n  docs: https://useblume.dev/custom",
        plugin: "blume",
        stack: "",
      },
      type: "error",
    });
  });

  it("filters out non-errors and omits absent location, fix, and docs", () => {
    let payload: OverlayPayload | undefined;
    serverSetup(
      {},
      {
        // Vite 6+ exposes the HMR channel as `.hot`; the overlay falls back to it.
        hot: {
          send: (p: unknown) => {
            payload = p as OverlayPayload;
          },
        },
      }
    );

    showBlumeErrorOverlay([
      { code: "BLUME_WARN", message: "just a warning", severity: "warning" },
      { code: "BLUME_UNMAPPED", message: "boom", severity: "error" },
    ]);

    expect(payload).toEqual({
      err: {
        id: undefined,
        message: "Blume found 1 error(s):\n\n[BLUME_UNMAPPED] boom",
        plugin: "blume",
        stack: "",
      },
      type: "error",
    });
  });

  it("is a no-op when there are no error diagnostics", () => {
    let sent = false;
    serverSetup(
      {},
      {
        ws: {
          send: () => {
            sent = true;
          },
        },
      }
    );

    showBlumeErrorOverlay([
      { code: "BLUME_WARN", message: "warn", severity: "warning" },
    ]);

    expect(sent).toBe(false);
  });

  it("is a no-op when the dev server exposes no HMR channel", () => {
    serverSetup();
    const diagnostics: Diagnostic[] = [
      { code: "BLUME_UNMAPPED", message: "boom", severity: "error" },
    ];

    expect(() => showBlumeErrorOverlay(diagnostics)).not.toThrow();
  });
});
