import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://kromiii.info",
  output: "server",
  adapter: cloudflare({ platformProxy: { enabled: true } }),
});
