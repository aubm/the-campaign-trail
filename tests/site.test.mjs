import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
const root = resolve("dist");
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : join(dir, e.name),
      ),
    )
  ).flat();
}
test("every local page, image, stylesheet and fragment target exists", async () => {
  for (const path of (await files(root)).filter((f) => f.endsWith(".html"))) {
    const html = await readFile(path, "utf8");
    for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (!target.startsWith("/") && !target.startsWith("#")) continue;
      const url = new URL(
        target,
        `https://example.test/${path.slice(root.length + 1)}`,
      );
      const destination = join(root, decodeURIComponent(url.pathname));
      let file = destination;
      if ((await stat(destination).catch(() => null))?.isDirectory())
        file = join(destination, "index.html");
      assert.ok(
        await stat(file).catch(() => null),
        `${path}: missing ${target}`,
      );
      if (url.hash && file.endsWith(".html")) {
        const document = await readFile(file, "utf8");
        assert.ok(
          document.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
          `${path}: missing fragment ${target}`,
        );
      }
    }
  }
});
test("chapter order and previous/next boundaries stay inside their adventure", async () => {
  const adventures = {};
  for (const path of await files(resolve("src/content/chapters"))) {
    if (!path.endsWith(".md")) continue;
    const source = await readFile(path, "utf8");
    const adventure = source.match(/^adventure: (.+)$/m)?.[1]?.trim();
    const order = Number(source.match(/^order: (\d+)$/m)?.[1]);
    assert.ok(
      adventure && Number.isInteger(order),
      `Missing chapter metadata in ${path}`,
    );
    (adventures[adventure] ||= []).push({
      order,
      slug: path.split("/").at(-1).replace(/\.md$/, ""),
    });
  }
  for (const adventure of Object.keys(adventures)) {
    adventures[adventure] = adventures[adventure]
      .sort((a, b) => a.order - b.order)
      .map((c) => c.slug);
  }
  for (const [adventure, chapters] of Object.entries(adventures)) {
    for (let i = 0; i < chapters.length; i++) {
      const html = await readFile(
        join(root, "adventures", adventure, chapters[i], "index.html"),
        "utf8",
      );
      for (const [rel, expected] of [
        ["prev", chapters[i - 1]],
        ["next", chapters[i + 1]],
      ]) {
        const target = html.match(
          new RegExp(`rel="${rel}" href="([^"]+)"`),
        )?.[1];
        assert.equal(
          target,
          expected ? `/adventures/${adventure}/${expected}/` : undefined,
        );
      }
      assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    }
  }
});
test("production domain survives the build", async () => {
  assert.equal(
    (await readFile(join(root, "CNAME"), "utf8")).trim(),
    "the-campaign-trail.aubm.net",
  );
  assert.match(
    await readFile(join(root, "index.html"), "utf8"),
    /rel="canonical" href="https:\/\/the-campaign-trail\.aubm\.net\/"/,
  );
});
