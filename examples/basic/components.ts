import { defineComponents } from "blume";

import Counter from "./components/CounterIsland.astro";
import Callout from "./components/CustomCallout.astro";

export default defineComponents({
  mdx: {
    Callout,
    Counter,
  },
});
