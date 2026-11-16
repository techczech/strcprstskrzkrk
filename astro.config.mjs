import { defineConfig } from "astro/config";

// Static output for Cloudflare Pages. No server code, no adapters.
export default defineConfig({
  site: "https://strcprstskrzkrk.com",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
});
