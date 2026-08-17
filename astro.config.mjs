import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://kromiii.info",
  output: "static",
  integrations: [sitemap()],
});
