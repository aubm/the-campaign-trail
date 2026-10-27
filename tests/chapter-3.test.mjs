import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const root = resolve("dist");
const adventure = "la-tombe-de-l-annihilation";
const slug = "la-sagesse-des-mers";
const expectedNumbers = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "13", "15"];
const expectedVersions = ["V1", "V2", "V1", "V5", "V3", "V1", "V2", "V2", "V4", "V2", "V4", "V4", "V3"];
const manifest = JSON.parse(await readFile(resolve("artwork/chapter-3-sources.json"), "utf8"));
const page = (prefix = "") => readFile(join(root, prefix, "adventures", adventure, slug, "index.html"), "utf8");
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const chapterImages = (html) => [...html.matchAll(/<img\b[^>]*>/g)]
  .map(([tag]) => tag)
  .filter((tag) => attr(tag, "src")?.startsWith("/images/chapter-3/"));
const urlFor = (variant) => `/${variant.path.replace(/^public\//, "")}`;

test("chapter three retains all six reader sequences and the unillustrated ending", async () => {
  const french = await page("fr");
  assert.equal((french.match(/<h2\b/g) || []).length, 6);
  for (const text of [
    "La Sagesse des Mers",
    "Jana avait cessé de compter les jours",
    "La table du capitaine",
    "Le premier assaut",
    "Le dernier regard",
    "La coque céda.",
    "Elle pensa à Celeborn.",
    "Elle tendit la main vers la lumière.",
    "Puis elle ne vit plus rien.",
  ]) assert.ok(french.includes(text), `Missing chapter text: ${text}`);
  for (const text of ["Note de continuité", "Narration et dialogues", "Inventions et arbitrages", "Script V3", "brouillon à relire"]) {
    assert.ok(!french.includes(text), `Working notes leaked into the chapter: ${text}`);
  }
  assert.ok(!french.includes('class="translation-notice"'));
  const source = await readFile(resolve(`src/content/chapters/fr/${adventure}/${slug}.md`), "utf8");
  assert.match(source, /^order: 3$/m);
  assert.match(source, /^sample: false$/m);
  const narrative = source.split("---").slice(2).join("---").replace(/<figure\b[\s\S]*?<\/figure>/g, "");
  assert.ok(narrative.trim().endsWith("Puis elle ne vit plus rien."));
  assert.ok(narrative.split(/\s+/).length > 3500, "The chapter must not be replaced with a summary");
});

test("chapter three publishes exactly the thirteen approved scenes in original order", async () => {
  assert.deepEqual(manifest.map((entry) => entry.number), expectedNumbers);
  assert.deepEqual(manifest.map((entry) => entry.version), expectedVersions);
  const files = await readdir(resolve("public/images/chapter-3"));
  assert.equal(files.length, 26);
  assert.ok(files.every((file) => file.endsWith(".webp")));
  const tags = chapterImages(await page("fr"));
  assert.equal(tags.length, 13, "I01 is the hero; the other twelve scenes appear once in the body");
  assert.deepEqual(tags.map((tag) => attr(tag, "src")), manifest.map((entry) => urlFor(entry.variants.at(-1))));
  for (const omitted of ["12", "14", "16"]) {
    assert.ok(!files.some((file) => file.startsWith(`${omitted}-`)), `Omitted scene I${omitted} must stay omitted`);
  }
});

test("approved WebP variants match their manifest and retain native aspect ratios", async () => {
  const tags = chapterImages(await page("fr"));
  for (const [index, entry] of manifest.entries()) {
    assert.match(entry.file, new RegExp(` - ${entry.version} - VALIDEE\\.png$`));
    assert.match(entry.driveUrl, /^https:\/\/drive\.google\.com\/file\/d\/[^/]+\/view$/);
    assert.match(entry.sha256, /^[0-9a-f]{64}$/);
    assert.equal(entry.variants.length, 2);
    const [small, native] = entry.variants;
    assert.equal(small.width, 640);
    assert.deepEqual([native.width, native.height], entry.dimensions);
    assert.equal(small.height, Math.round(native.height * 640 / native.width));
    for (const variant of entry.variants) {
      const bytes = await readFile(resolve(variant.path));
      assert.equal(bytes.length, variant.size);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), variant.sha256);
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
      assert.ok(bytes.length < entry.size, `${variant.path} should be smaller than the original PNG`);
      assert.deepEqual(await readFile(join(root, variant.path.replace(/^public\//, ""))), bytes);
    }
    const tag = tags[index];
    assert.equal(Number(attr(tag, "width")), native.width);
    assert.equal(Number(attr(tag, "height")), native.height);
    assert.equal(attr(tag, "srcset"), `${urlFor(small)} 640w, ${urlFor(native)} ${native.width}w`);
    assert.ok(attr(tag, "alt")?.length > 20, `Missing descriptive alt text for I${entry.number}`);
    assert.ok(attr(tag, "sizes"), `Missing responsive sizes for I${entry.number}`);
    if (index === 0) assert.equal(attr(tag, "fetchpriority"), "high");
    else {
      assert.equal(attr(tag, "loading"), "lazy");
      assert.equal(attr(tag, "decoding"), "async");
    }
  }
});

test("chapter three publishes the complete illustrated story in English with matching navigation", async () => {
  const english = await page();
  const french = await page("fr");
  assert.equal((english.match(/<h2\b/g) || []).length, 6);
  assert.ok(!english.includes('class="translation-notice"'));
  assert.ok(!english.includes("Jana avait cessé de compter les jours"));
  assert.ok(!english.includes("An English translation is coming soon."));
  assert.deepEqual(
    chapterImages(english).map((tag) => attr(tag, "src")),
    chapterImages(french).map((tag) => attr(tag, "src")),
    "The approved illustrations must appear in the same order in both languages",
  );
  assert.equal(chapterImages(english).length, 13);
  for (const t of [
    "The Wisdom of the Seas",
    "Jana had stopped counting the days",
    "The Captain",
    "The First Assault",
    "The Last Glimpse",
    "The hull gave way.",
    "She thought of Celeborn.",
    "She reached towards the light.",
    "Then she saw nothing more.",
  ]) assert.ok(english.includes(t), "Missing translated chapter text: " + t);
  for (const term of ["Maîîî", "Lathandre", "Le pain de Ghaar", "Les premiers grappins", "Les derniers jours de mer"]) {
    assert.ok(!english.includes(term), "French text leaked into the English chapter: " + term);
  }
  const source = await readFile(resolve("src/content/chapters/" + adventure + "/" + slug + ".md"), "utf8");
  assert.ok(!source.includes("translationPending: true"));
  assert.match(source, /^order: 3$/m);
  assert.match(source, /^sample: false$/m);
  const narrative = source.split("---").slice(2).join("---").replace(/<figure\b[\s\S]*?<\/figure>/g, "");
  assert.ok(narrative.trim().endsWith("Then she saw nothing more."));
  assert.ok(narrative.split(/\s+/).length > 3500, "The English story must not be an abridgement");
  for (const prefix of ["", "fr"]) {
    const routePrefix = prefix ? "/fr" : "";
    const chapter = await page(prefix);
    const previous = await readFile(join(root, prefix, "adventures", adventure, "les-passagers", "index.html"), "utf8");
    assert.ok(previous.includes(`rel="next" href="${routePrefix}/adventures/${adventure}/${slug}/"`));
    assert.ok(chapter.includes(`rel="prev" href="${routePrefix}/adventures/${adventure}/les-passagers/"`));
    assert.ok(!chapter.includes('rel="next"'), "The last selected chapter must not fabricate a sequel");
    const contents = await readFile(join(root, prefix, "adventures", adventure, "index.html"), "utf8");
    assert.ok(contents.includes(`href="${routePrefix}/adventures/${adventure}/${slug}/"`));
  }
});
