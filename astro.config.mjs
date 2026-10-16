import { defineConfig } from "astro/config";
export default defineConfig({
  site: "https://the-campaign-trail.aubm.net",
  output: "static",
  trailingSlash: "always",
  devToolbar: { enabled: false },
});
