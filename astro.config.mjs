import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://kromiii.info",
  output: "static",
  adapter: cloudflare({ platformProxy: { enabled: true } }),
});
