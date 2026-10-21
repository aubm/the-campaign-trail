import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const number = process.env.PREVIEW_PR_NUMBER;
assert.match(
  number ?? "",
  /^[1-9]\d*$/,
  "Set PREVIEW_PR_NUMBER for a preview build and its tests",
);
const prefix = `/pr-preview/pr-${number}`;
const root = resolve("dist");
const origin = "https://the-campaign-trail.aubm.net";
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? files(join(dir, entry.name))
          : join(dir, entry.name),
      ),
    )
  ).flat();
}
const all = await files(root);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

async function verifyUrl(value, from) {
  if (!value.startsWith("/") && !value.startsWith("#")) return;
  if (value.startsWith("//")) return;
  const url = new URL(value, origin + prefix + from.slice(root.length));
  assert.ok(
    url.pathname.startsWith(prefix + "/"),
    `${from}: URL escapes preview: ${value}`,
  );
  let path = join(root, decodeURIComponent(url.pathname.slice(prefix.length)));
  if ((await stat(path).catch(() => null))?.isDirectory())
    path = join(path, "index.html");
  assert.ok(await stat(path).catch(() => null), `${from}: missing ${value}`);
  if (url.hash && path.endsWith(".html")) {
    const html = await readFile(path, "utf8");
    assert.ok(
      html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
      `${from}: missing anchor ${value}`,
    );
  }
}

test("every preview page, image, srcset, script, font and anchor stays inside the deployment", async () => {
  for (const file of all.filter((path) => /\.(html|css)$/.test(path))) {
    const content = await readFile(file, "utf8");
    const urls = [...content.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(
      (match) => match[1],
    );
    for (const [, srcset] of content.matchAll(/srcset="([^"]+)"/g)) {
      urls.push(
        ...srcset
          .split(",")
          .map((candidate) => candidate.trim().split(/\s+/)[0]),
      );
    }
    urls.push(
      ...[...content.matchAll(/url\(["']?([^\s)'";]+)["']?\)/g)].map(
        (match) => match[1],
      ),
    );
    for (const url of urls) await verifyUrl(url, file);
  }
});

test("preview metadata, language switching, and chapter navigation use preview URLs without Analytics", async () => {
  for (const file of all.filter((path) => path.endsWith(".html"))) {
    const html = await readFile(file, "utf8");
    const route = file.slice(root.length).replace(/index\.html$/, "");
    const locale = route.startsWith("/fr/") ? "fr" : "en";
    assert.ok(html.includes(`<html lang="${locale}">`));
    assert.ok(
      html.includes('<meta name="robots" content="noindex, nofollow">'),
    );
    assert.doesNotMatch(html, /googletagmanager\.com|gtag\("config"/);
    assert.ok(
      html.includes(`rel="canonical" href="${origin}${prefix}${route}"`),
    );
    const switcher = html.match(
      /<nav class="language-switch"[^>]*>([\s\S]*?)<\/nav>/,
    )?.[1];
    assert.ok(switcher);
    for (const [, tag] of switcher.matchAll(/(<a\b[^>]*>)/g)) {
      const target = attr(tag, "href");
      await verifyUrl(target, file);
      const language = attr(tag, "hreflang");
      let counterpart = join(root, target.slice(prefix.length));
      if (target.endsWith("/")) counterpart = join(counterpart, "index.html");
      const translated = await readFile(counterpart, "utf8");
      assert.ok(translated.includes(`<html lang="${language}">`));
      assert.ok(
        translated.includes(`href="${prefix}${route}"`),
        "Language switches must be reciprocal",
      );
    }
    for (const [, tag] of html.matchAll(/(<a\b[^>]*>)/g)) {
      const href = attr(tag, "href");
      if (!href?.startsWith(prefix + "/") || attr(tag, "hreflang")) continue;
      assert.equal(
        href.startsWith(prefix + "/fr/"),
        locale === "fr",
        `${route}: language changed at ${href}`,
      );
    }
  }
});
