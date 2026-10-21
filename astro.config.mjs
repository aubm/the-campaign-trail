import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import markdownBase from "./scripts/markdown-base.mjs";

const previewNumber = process.env.PREVIEW_PR_NUMBER ?? "";
if (previewNumber && !/^[1-9]\d*$/.test(previewNumber)) {
  throw new Error("PREVIEW_PR_NUMBER must be a positive pull request number.");
}
const base = previewNumber ? `/pr-preview/pr-${previewNumber}/` : "/";

export default defineConfig({
  site: "https://the-campaign-trail.aubm.net",
  base,
  markdown: previewNumber
    ? { processor: satteri({ hastPlugins: [markdownBase(base)] }) }
    : {},
  output: "static",
  trailingSlash: "always",
  devToolbar: { enabled: false },
});
