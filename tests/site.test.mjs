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
    const prefix = adventure.startsWith("fr/") ? "/fr" : "";
    const slug = adventure.replace(/^fr\//, "");
    for (let i = 0; i < chapters.length; i++) {
      const html = await readFile(
        join(root, prefix, "adventures", slug, chapters[i], "index.html"),
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
          expected ? `${prefix}/adventures/${slug}/${expected}/` : undefined,
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

const attribute = (tag, name) =>
  tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const fileForUrl = (url) =>
  join(root, url.endsWith("/") ? `${url}index.html` : url);

test("every page has working reciprocal language switches, language metadata, and a distinct translation", async () => {
  for (const file of (await files(root)).filter((f) => f.endsWith(".html"))) {
    const html = await readFile(file, "utf8");
    const relative = file.slice(root.length).replace(/index\.html$/, "");
    const language = relative.startsWith("/fr/") ? "fr" : "en";
    assert.ok(
      html.includes(`<html lang="${language}">`),
      `${relative}: incorrect document language`,
    );
    const canonicalTag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/)?.[0];
    assert.equal(
      attribute(canonicalTag, "href"),
      `https://the-campaign-trail.aubm.net${relative}`,
    );
    const alternateTags = [
      ...html.matchAll(/<link\b[^>]*rel="alternate"[^>]*>/g),
    ].map((m) => m[0]);
    const languageNav = html.match(
      /<nav class="language-switch"[^>]*>([\s\S]*?)<\/nav>/,
    )?.[1];
    assert.ok(languageNav, `${relative}: missing language switcher`);
    for (const locale of ["en", "fr"]) {
      const tag = alternateTags.find(
        (t) => attribute(t, "hreflang") === locale,
      );
      assert.ok(tag, `${relative}: missing ${locale} alternate`);
      const url = new URL(attribute(tag, "href"));
      const target = await readFile(fileForUrl(url.pathname), "utf8");
      assert.ok(target.includes(`<html lang="${locale}">`));
      const link = [...languageNav.matchAll(/<a\b[^>]*>/g)]
        .map((m) => m[0])
        .find((t) => attribute(t, "hreflang") === locale);
      assert.equal(
        attribute(link, "href"),
        url.pathname,
        "switcher and alternate must agree",
      );
      assert.equal(
        attribute(link, "aria-current"),
        locale === language ? "true" : undefined,
      );
      if (locale !== language) {
        const reverse = [
          ...target.matchAll(/<link\b[^>]*rel="alternate"[^>]*>/g),
        ]
          .map((m) => m[0])
          .find((t) => attribute(t, "hreflang") === language);
        assert.equal(
          attribute(reverse, "href"),
          `https://the-campaign-trail.aubm.net${relative}`,
          "translations must link back to the same page",
        );
        assert.notEqual(
          target.match(/<meta name="description" content="([^"]*)"/)?.[1],
          html.match(/<meta name="description" content="([^"]*)"/)?.[1],
          "translated pages must have translated descriptions (product titles may remain original)",
        );
      }
    }
    for (const [, tag] of html.matchAll(/(<a\b[^>]*>)/g)) {
      const href = attribute(tag, "href");
      if (!href?.startsWith("/") || attribute(tag, "hreflang")) continue;
      assert.equal(
        href.startsWith("/fr/"),
        language === "fr",
        `${relative}: navigation changes language at ${href}`,
      );
    }
  }
});

test("French chapters contain translated prose, image descriptions, and navigation labels", async () => {
  const html = await readFile(
    join(root, "fr/adventures/embers-of-the-north/the-old-road/index.html"),
    "utf8",
  );
  for (const text of [
    "La Vieille Route",
    "Un inconnu à la croisée des chemins",
    "Chapitre suivant",
    "Sommaire de l’aventure",
    "Des voyageurs en cape",
  ])
    assert.ok(html.includes(text), `Missing French content: ${text}`);
  for (const text of [
    "A stranger at the crossroads",
    "Next chapter",
    "Sample chapter",
    "Travelers follow",
  ])
    assert.ok(!html.includes(text), `Untranslated English content: ${text}`);
});

test("published adventures connect home, catalogue, and product pages in both languages", async () => {
  for (const prefix of ["", "/fr"]) {
    const detailPath = `${prefix}/play/escape-the-dawn-warrior-island/`;
    for (const route of [`${prefix}/`, `${prefix}/play/`]) {
      const html = await readFile(fileForUrl(route), "utf8");
      assert.ok(html.includes(`href="${detailPath}"`));
    }
    const detail = await readFile(fileForUrl(detailPath), "utf8");
    assert.match(
      detail,
      /href="https:\/\/www.dmsguild.com\/(?:en|fr)\/product\/450203\/escape-the-dawn-warrior-island"/,
    );
    assert.ok(
      detail.includes(
        'href="https://d1vzi28wh99zvq.cloudfront.net/pdf_previews/450203-sample.pdf"',
      ),
    );
    assert.ok(detail.includes(prefix ? "PDF en anglais" : "English PDF"));
    assert.ok(detail.includes('src="/images/dawn-warrior-island.webp"'));
    assert.ok(
      !detail.includes('rel="next"'),
      "a publication is not a journal chapter",
    );
  }
});
