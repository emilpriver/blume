import { afterAll, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";

import { join } from "pathe";

import {
  copyAssetMounts,
  serveAssetMounts,
} from "../src/astro/static-assets.ts";
import { resolveAssetMounts } from "../src/core/assets.ts";

const dirs: string[] = [];

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

const fixture = async (): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), "blume-static-"));
  dirs.push(root);
  await mkdir(join(root, "images", "sub"), { recursive: true });
  await writeFile(join(root, "images", "create.png"), "png-bytes");
  await writeFile(join(root, "images", "sub", "nested.svg"), "<svg/>");
  return root;
};

/** Drive the (synchronous) middleware once and capture how it responded. */
const runOnce = (
  handler: (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ) => void,
  method: string,
  url: string
) => {
  const headers: Record<string, string> = {};
  let ended = false;
  let nexted = false;
  const res = {
    // Enough of a writable that `createReadStream().pipe(res)` doesn't throw.
    emit: () => false,
    end: () => {
      ended = true;
    },
    on: () => res,
    once: () => res,
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
    write: () => true,
  };
  handler(
    { method, url } as IncomingMessage,
    res as unknown as ServerResponse,
    () => {
      nexted = true;
    }
  );
  return { ended, headers, nexted };
};

describe(resolveAssetMounts, () => {
  it("normalizes entries to a leading-slash url and root-joined dir", () => {
    const mounts = resolveAssetMounts("/project", [
      "images",
      "./assets/img/",
      "/logo",
    ]);
    expect(mounts).toStrictEqual([
      { dir: "/project/images", url: "/images" },
      { dir: "/project/assets/img", url: "/assets/img" },
      { dir: "/project/logo", url: "/logo" },
    ]);
  });

  it("strips `..` so a mount cannot escape the project root", () => {
    const [mount] = resolveAssetMounts("/project", ["../../etc"]);
    expect(mount?.dir).toBe("/project/etc");
    expect(mount?.url).toBe("/etc");
  });
});

describe(serveAssetMounts, () => {
  it("serves a mounted file with content-type and length headers", async () => {
    const root = await fixture();
    const handler = serveAssetMounts(resolveAssetMounts(root, ["images"]));
    const result = runOnce(handler, "GET", "/images/create.png");
    expect(result.nexted).toBe(false);
    expect(result.headers["content-type"]).toBe("image/png");
    expect(result.headers["content-length"]).toBe("9");
  });

  it("answers HEAD without streaming a body", async () => {
    const root = await fixture();
    const handler = serveAssetMounts(resolveAssetMounts(root, ["images"]));
    const result = runOnce(handler, "HEAD", "/images/sub/nested.svg");
    expect(result.headers["content-type"]).toBe("image/svg+xml");
    expect(result.ended).toBe(true);
    expect(result.nexted).toBe(false);
  });

  it("falls through for a non-match, a missing file, or a non-GET method", async () => {
    const root = await fixture();
    const handler = serveAssetMounts(resolveAssetMounts(root, ["images"]));
    expect(runOnce(handler, "GET", "/other/x.png").nexted).toBe(true);
    expect(runOnce(handler, "GET", "/images/missing.png").nexted).toBe(true);
    expect(runOnce(handler, "POST", "/images/create.png").nexted).toBe(true);
  });

  it("refuses to traverse out of the mount directory", async () => {
    const root = await fixture();
    await writeFile(join(root, "secret.txt"), "top-secret");
    const handler = serveAssetMounts(resolveAssetMounts(root, ["images"]));
    expect(runOnce(handler, "GET", "/images/../secret.txt").nexted).toBe(true);
  });
});

describe(copyAssetMounts, () => {
  it("copies mount trees into the output dir and skips absent sources", async () => {
    const root = await fixture();
    const out = await mkdtemp(join(tmpdir(), "blume-out-"));
    dirs.push(out);
    await copyAssetMounts(resolveAssetMounts(root, ["images", "absent"]), out);
    const png = await readFile(join(out, "images", "create.png"), "utf-8");
    expect(png).toBe("png-bytes");
    expect(existsSync(join(out, "images", "sub", "nested.svg"))).toBe(true);
    expect(existsSync(join(out, "absent"))).toBe(false);
  });
});
