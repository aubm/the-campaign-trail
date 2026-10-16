import { getCollection, type CollectionEntry } from "astro:content";
import { contentKey, localizePath, type Locale } from "./i18n";
export const adventureUrl = (id: string, locale: Locale = "en") =>
  localizePath(`/adventures/${contentKey(id)}/`, locale);
export const chapterUrl = (chapter: CollectionEntry<"chapters">) =>
  `${adventureUrl(chapter.data.adventure.id, chapter.data.locale)}${chapter.id.split("/").at(-1)}/`;

export function validateTranslations(
  entries: { id: string; data: { locale: Locale; order: number } }[],
) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const entry of entries) {
    const key = contentKey(entry.id);
    if ((entry.data.locale === "fr") !== entry.id.startsWith("fr/"))
      throw new Error(`Locale and content folder disagree: ${entry.id}`);
    const counterpart = byId.get(
      entry.data.locale === "fr" ? key : `fr/${key}`,
    );
    if (!counterpart)
      throw new Error(
        `Missing translation for ${entry.id}. Add matching English and French Markdown files.`,
      );
    if (counterpart.data.order !== entry.data.order)
      throw new Error(`Translation orders differ for ${key}`);
  }
}
export async function getCampaign(locale: Locale = "en") {
  const allAdventures = await getCollection("adventures");
  const allChapters = await getCollection("chapters");
  validateTranslations(allAdventures);
  validateTranslations(allChapters);
  for (const chapter of allChapters) {
    const adventure = allAdventures.find(
      (a) => a.id === chapter.data.adventure.id,
    );
    if (!adventure || adventure.data.locale !== chapter.data.locale)
      throw new Error(`Invalid adventure or language for ${chapter.id}`);
    const counterpart = allChapters.find(
      (c) =>
        c.id ===
        (chapter.data.locale === "fr"
          ? contentKey(chapter.id)
          : `fr/${chapter.id}`),
    );
    if (
      counterpart &&
      contentKey(counterpart.data.adventure.id) !==
        contentKey(chapter.data.adventure.id)
    )
      throw new Error(
        `Translated chapters belong to different adventures: ${chapter.id}`,
      );
  }
  const adventures = allAdventures
    .filter((a) => a.data.locale === locale)
    .sort((a, b) => a.data.order - b.data.order);
  const chapters = allChapters
    .filter((c) => c.data.locale === locale)
    .sort((a, b) => a.data.order - b.data.order);
  const orders = new Set<number>();
  for (const adventure of adventures) {
    if (orders.has(adventure.data.order))
      throw new Error(`Duplicate adventure order: ${adventure.data.order}`);
    orders.add(adventure.data.order);
    const seen = new Set<number>();
    const slugs = new Set<string>();
    for (const chapter of chapters.filter(
      (c) => c.data.adventure.id === adventure.id,
    )) {
      const slug = chapterUrl(chapter);
      if (seen.has(chapter.data.order) || slugs.has(slug))
        throw new Error(`Duplicate chapter order or URL in ${adventure.id}`);
      seen.add(chapter.data.order);
      slugs.add(slug);
    }
  }
  return adventures.map((adventure) => ({
    adventure,
    chapters: chapters.filter(
      (chapter) => chapter.data.adventure.id === adventure.id,
    ),
  }));
}
