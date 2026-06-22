import { join } from "pathe";

/** A file copied into the user's project by `blume add`. */
export interface RegistryFile {
  /** Path relative to the registry item directory. */
  source: string;
  /** Destination path relative to the project root. */
  target: string;
}

export interface RegistryItem {
  name: string;
  description: string;
  files: RegistryFile[];
  /** Lines printed after install to guide the user. */
  postInstall: string[];
}

/** Absolute path to the bundled registry item sources. */
export const itemsRoot = join(import.meta.dirname, "items");

/** The built-in, Blume-owned source registry. */
export const registry: RegistryItem[] = [
  {
    description: "A 'Was this helpful?' feedback widget (static, no server).",
    files: [
      {
        source: "feedback/components/blume/Feedback.astro",
        target: "components/blume/Feedback.astro",
      },
    ],
    name: "feedback",
    postInstall: [
      "Register it in components.ts:",
      '  import Feedback from "./components/blume/Feedback.astro";',
      "  export default defineComponents({ mdx: { Feedback } });",
      "Then use <Feedback /> in any MDX page.",
    ],
  },
];

export const findItem = (name: string): RegistryItem | undefined =>
  registry.find((item) => item.name === name);
