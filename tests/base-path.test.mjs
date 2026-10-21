import { test } from "node:test";
import assert from "node:assert/strict";
import { createPaths } from "../src/lib/base-path.mjs";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import markdownBase from "../scripts/markdown-base.mjs";

test("deployment paths preserve fragments, external URLs, and existing prefixes", () => {
  const { withBase, stripBase, withBaseSrcset } =
    createPaths("/pr-preview/pr-18/");
  assert.equal(withBase("/fr/#adventures"), "/pr-preview/pr-18/fr/#adventures");
  assert.equal(withBase("/pr-preview/pr-18/fr/"), "/pr-preview/pr-18/fr/");
  assert.equal(stripBase("/pr-preview/pr-18/fr/"), "/fr/");
  assert.equal(stripBase("/pr-preview/pr-180/fr/"), "/pr-preview/pr-180/fr/");
  for (const url of [
    "#scene",
    "https://example.com/a",
    "//cdn.example.com/a",
    "mailto:a@example.com",
    "data:image/png;base64,abc",
  ]) {
    assert.equal(withBase(url), url);
  }
  assert.equal(
    withBaseSrcset("/images/small.webp 640w, /images/large.webp 1672w"),
    "/pr-preview/pr-18/images/small.webp 640w, /pr-preview/pr-18/images/large.webp 1672w",
  );
  assert.equal(createPaths("/").withBase("/fr/"), "/fr/");
});

test("Markdown and raw HTML figures receive the same preview prefix", async () => {
  const renderer = await createSatteriMarkdownProcessor({
    hastPlugins: [markdownBase("/pr-preview/pr-18/")],
  });
  const { code } = await renderer.render(
    '[Français](/fr/)\n\n![Image](/images/a.webp)\n\n<figure><img src="/images/a.webp" srcset="/images/a.webp 640w, /images/b.webp 1200w"/><a href="https://example.com/">Link</a></figure>',
  );
  assert.match(code, /href="\/pr-preview\/pr-18\/fr\/"/);
  assert.match(code, /src="\/pr-preview\/pr-18\/images\/a.webp"/);
  assert.match(code, /pr-18\/images\/b.webp 1200w/);
  assert.match(code, /href="https:\/\/example.com\/"/);
});
