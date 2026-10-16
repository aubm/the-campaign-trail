export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];

// Keep existing English URLs; French mirrors them under /fr/.
export function localizePath(path: string, locale: Locale): string {
  const unprefixed = path.replace(/^\/fr(?=\/|$)/, "") || "/";
  return locale === "fr" ? `/fr${unprefixed}` : unprefixed;
}
export const contentKey = (id: string) => id.replace(/^fr\//, "");

const en = {
  tagline: "Stories from the table",
  description:
    "Stories from the table. An illustrated journal of adventures, unlikely heroes, and roads less traveled.",
  skip: "Skip to content",
  adventures: "Chronicles",
  publications: "Adventures to play",
  language: "Language",
  footer: "Rolled at the table. Remembered on the page.",
  independent: "An independent D&D campaign journal.",
  heroAlt:
    "Travelers follow a mountain trail toward a mist-shrouded citadel at dawn.",
  chronicle: "A chronicle of shared adventures",
  heroTitle: ["Every great story", "starts with a road."],
  heroText: [
    "Of unlikely heroes. Of impossible choices.",
    "Of the worlds we brought to life around a table.",
  ],
  openJournal: "Open the journal",
  collected: "The collected chronicles",
  choose: "Read the chronicles",
  libraryText: [
    "Different worlds. Different companions.",
    "The same call to adventure.",
  ],
  volume: "Volume",
  chapter: "Chapter",
  chapterSingular: "chapter",
  chapterPlural: "chapters",
  explore: "Explore the adventure",
  start: "Start with chapter one",
  noteTitle: "A journal waiting to be filled.",
  note: "These are sample adventures and chapters, setting the stage for the real stories to come.",
  breadcrumb: "Breadcrumb",
  journal: "The journal",
  adventure: "The adventure",
  begin: "Begin the story",
  turnPage: "Turn the page",
  contents: "Contents",
  empty: "The first chapter is yet to be written.",
  inAdventure: "In this adventure",
  onPage: "On this page",
  adventureContents: "Adventure contents",
  sample: "Sample chapter · The real chronicle is still to come",
  chapterNavigation: "Chapter navigation",
  previous: "Previous chapter",
  next: "Next chapter",
  back: "Back to",
  pause: "The story pauses here",
  another: "Explore another adventure",
  notFoundTitle: "A turn off the trail",
  notFoundEyebrow: "404 · Uncharted territory",
  notFoundHeading: ["This road fades", "into the mist."],
  notFoundText: "The page you’re looking for isn’t in this journal.",
  return: "Return to the trail",
};
const fr: typeof en = {
  tagline: "Récits autour de la table",
  description:
    "Récits autour de la table. Un journal illustré d’aventures, de héros improbables et de chemins de traverse.",
  skip: "Aller au contenu",
  adventures: "Chroniques",
  publications: "Aventures à jouer",
  language: "Langue",
  footer: "Vécu autour de la table. Raconté au fil des pages.",
  independent: "Un journal indépendant de campagnes de D&D.",
  heroAlt:
    "À l’aube, des voyageurs suivent un sentier de montagne vers une citadelle enveloppée de brume.",
  chronicle: "La chronique de nos aventures",
  heroTitle: ["Toute grande histoire", "commence en chemin."],
  heroText: [
    "Des héros improbables. Des choix impossibles.",
    "Des mondes auxquels nous avons donné vie autour d’une table.",
  ],
  openJournal: "Ouvrir le journal",
  collected: "Au fil des chroniques",
  choose: "Lisez les chroniques",
  libraryText: [
    "D’autres mondes. D’autres compagnons.",
    "Le même appel de l’aventure.",
  ],
  volume: "Tome",
  chapter: "Chapitre",
  chapterSingular: "chapitre",
  chapterPlural: "chapitres",
  explore: "Découvrir l’aventure",
  start: "Lire le premier chapitre",
  noteTitle: "Un journal qui attend ses histoires.",
  note: "Ces aventures et ces chapitres sont des exemples, en attendant les véritables récits à venir.",
  breadcrumb: "Fil d’Ariane",
  journal: "Le journal",
  adventure: "L’aventure",
  begin: "Commencer le récit",
  turnPage: "Tournez la page",
  contents: "Sommaire",
  empty: "Le premier chapitre reste à écrire.",
  inAdventure: "Dans cette aventure",
  onPage: "Sur cette page",
  adventureContents: "Sommaire de l’aventure",
  sample: "Chapitre d’exemple · La véritable chronique reste à écrire",
  chapterNavigation: "Navigation entre les chapitres",
  previous: "Chapitre précédent",
  next: "Chapitre suivant",
  back: "Retour au",
  pause: "Le récit s’arrête ici pour l’instant",
  another: "Découvrir une autre aventure",
  notFoundTitle: "Hors des sentiers battus",
  notFoundEyebrow: "404 · Terres inexplorées",
  notFoundHeading: ["Ce chemin se perd", "dans la brume."],
  notFoundText: "La page que vous cherchez ne figure pas dans ce journal.",
  return: "Retrouver le chemin",
};
export const messages = { en, fr };
export const chapterCount = (count: number, locale: Locale) =>
  `${count} ${count === 1 ? messages[locale].chapterSingular : messages[locale].chapterPlural}`;
