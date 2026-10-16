import { getCollection, type CollectionEntry } from "astro:content";
import { contentKey, localizePath, type Locale } from "./i18n";
import { validateTranslations } from "./campaign";
export const publicationUrl = (entry: CollectionEntry<"publications">) =>
  localizePath(`/play/${contentKey(entry.id)}/`, entry.data.locale);
export async function getPublications(locale: Locale) {
  const all = await getCollection("publications");
  validateTranslations(all);
  const entries = all
    .filter((entry) => entry.data.locale === locale)
    .sort((a, b) => a.data.order - b.data.order);
  if (new Set(entries.map((entry) => entry.data.order)).size !== entries.length)
    throw new Error(`Duplicate publication order in ${locale}`);
  return entries;
}
