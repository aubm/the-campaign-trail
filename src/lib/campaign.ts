import { getCollection, type CollectionEntry } from "astro:content";
export const adventureUrl = (id: string) => `/adventures/${id}/`;
export const chapterUrl = (chapter: CollectionEntry<"chapters">) =>
  `${adventureUrl(chapter.data.adventure.id)}${chapter.id.split("/").at(-1)}/`;
export async function getCampaign() {
  const adventures = (await getCollection("adventures")).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const chapters = (await getCollection("chapters")).sort(
    (a, b) => a.data.order - b.data.order,
  );
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
