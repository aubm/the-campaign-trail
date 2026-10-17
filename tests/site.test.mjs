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

test("the Omu prologue is complete in both languages without revealing the later ritual", async () => {
  const slug = "la-tombe-de-l-annihilation";
  const frChapter = await readFile(fileForUrl(`/fr/adventures/${slug}/prologue/`), "utf8");
  for (const term of ["Les ombres d’Omu", "La cité oubliée", "Sous les pierres", "Le dernier feu", "Talia", "Elle pourrait bien se révéler utile", "Sommaire de l’aventure"]) {
    assert.ok(frChapter.includes(term), `Missing prologue text: ${term}`);
  }
  assert.ok(frChapter.includes('src="/images/prologue/01-1672.webp"'));
  assert.ok(!frChapter.includes("Chapitre d’exemple"));
  assert.ok(!frChapter.includes("Dendar"), "The later ritual must stay undisclosed");

  const enChapter = await readFile(fileForUrl(`/adventures/${slug}/prologue/`), "utf8");
  for (const term of ["Shadows of Omu", "The Forgotten City", "Beneath the Stones", "The Last Fire", "Talia", "She may yet prove useful", "End of the prologue"]) {
    assert.ok(enChapter.includes(term), `Missing English prologue text: ${term}`);
  }
  assert.ok(!enChapter.includes("currently available only in French"));
  assert.ok(!enChapter.includes("An English translation will be published later"));
  assert.ok(!enChapter.includes("Dendar"), "The later ritual must stay undisclosed in English");
  const images = (html) => [...html.matchAll(/<img[^>]+src="(\/images\/prologue\/[^"]+)"/g)].map((match) => match[1]);
  assert.equal(images(enChapter).length, 8);
  assert.deepEqual(images(enChapter), images(frChapter));
  assert.ok(enChapter.includes(`href="/fr/adventures/${slug}/prologue/"`));
  assert.ok(!enChapter.includes("La cité oubliée"));
  assert.ok(!enChapter.includes("Sample chapter"));

  const frAdventure = await readFile(fileForUrl(`/fr/adventures/${slug}/`), "utf8");
  for (const term of ["La Tombe de l’annihilation", "3 juillet 2021", "16 septembre 2023", "chapitre après chapitre"]) {
    assert.ok(frAdventure.includes(term), `Missing campaign introduction: ${term}`);
  }
  const enAdventure = await readFile(fileForUrl(`/adventures/${slug}/`), "utf8");
  assert.ok(enAdventure.includes("Tomb of Annihilation"));
  assert.ok(enAdventure.includes("The prologue is available in English and French"));
  assert.ok(!enAdventure.includes("English translation coming later"));
  assert.ok(enAdventure.includes(`href="/adventures/${slug}/prologue/"`));
  for (const locale of ["", "/fr"]) {
    const home = await readFile(fileForUrl(`${locale}/`), "utf8");
    assert.ok(home.includes(`href="${locale}/adventures/${slug}/"`));
    assert.ok(home.includes(`href="${locale}/adventures/${slug}/prologue/"`));
    assert.ok(!home.includes("Les Braises du Nord"));
    assert.ok(!home.includes("Embers of the North"));
    assert.equal(await stat(fileForUrl(`${locale}/adventures/embers-of-the-north/`)).catch(() => null), null);
  }
});

test("Ras Nsi illustration remains on adventure pages", async () => {
  const imagePath = join(root, "images", "omu-ras-nsi.webp");
  const webp = await readFile(imagePath);
  assert.equal(webp.toString("ascii", 0, 4), "RIFF", "WebP RIFF header");
  assert.equal(webp.toString("ascii", 8, 12), "WEBP", "WebP signature");
  assert.ok(webp.length < 400_000, "Optimized illustration should be less than 400 KB");
  for (const prefix of ["", "/fr"]) {
    for (const page of [
      `${prefix}/adventures/la-tombe-de-l-annihilation/`,
    ]) {
      const html = await readFile(fileForUrl(page), "utf8");
      assert.ok(html.includes('src="/images/omu-ras-nsi.webp"'), `${page} must use the new artwork`);
      assert.ok(html.includes("Ras Nsi"), `${page} must name Ras Nsi in its caption or alt text`);
    }
  }
});

test("the adventure introduction warns about spoilers and uses first-person publication", async () => {
  const slug = "la-tombe-de-l-annihilation";
  const fr = await readFile(fileForUrl(`/fr/adventures/${slug}/`), "utf8");
  assert.ok(fr.includes("Je publierai la suite"));
  assert.ok(!fr.includes("Nous publierons"));
  assert.ok(fr.includes("Attention — spoilers sur le module officiel."));
  assert.ok(fr.includes("Si vous jouez à cette campagne, ou comptez y jouer"));
  assert.ok(fr.includes('class="spoiler-warning"'));

  const en = await readFile(fileForUrl(`/adventures/${slug}/`), "utf8");
  assert.ok(en.includes("Spoiler warning — official adventure."));
  assert.ok(en.includes("If you are playing or plan to play"));
});

test("the chronicle catalogue displays one real adventure and a non-clickable coming-soon card", async () => {
  for (const locale of ["", "/fr"]) {
    const html = await readFile(fileForUrl(`${locale}/`), "utf8");
    assert.equal((html.match(/class="adventure-card"/g) || []).length, 1);
    assert.ok(html.includes('class="upcoming-adventure"'));
    assert.ok(html.includes(locale ? "Bientôt, d’autres aventures" : "More adventures coming soon"));
    assert.ok(!html.includes("La Côte des Murmures"));
    assert.ok(!html.includes("The Hollow Coast"));
    assert.ok(!html.includes("/adventures/the-hollow-coast/"));
    assert.equal(
      await stat(fileForUrl(`${locale}/adventures/the-hollow-coast/`)).catch(() => null),
      null,
      "A fictional adventure must not remain published",
    );
  }
});

test("adventure buttons preserve their foreground color outside hover", async () => {
  const css = await readFile(resolve("src/styles/book.css"), "utf8");
  assert.match(css, /\.prose a:not\(\.button\)\s*\{/);
  assert.match(css, /\.prose a\.button\s*\{\s*color:\s*#fff4df;/);
  assert.doesNotMatch(css, /\.prose a\s*\{\s*color:\s*var\(--red\);/);
  const html = await readFile(
    fileForUrl("/fr/adventures/la-tombe-de-l-annihilation/"),
    "utf8",
  );
  assert.ok(html.includes('class="button"'));
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
