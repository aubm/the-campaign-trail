# The Campaign Trail

An illustrated journal of tabletop adventures, built with Astro and Markdown. The journal now contains **La Tombe de l’annihilation**, a real campaign chronicle beginning with the French prologue *Les ombres d’Omu*. The homepage reserves space for upcoming adventures instead of listing fictional examples. The English prologue is a clearly marked translation-pending page. The visual direction is a fantasy sourcebook: parchment, oxblood headings, gold accents, serif typography, and original painterly landscape art.

## Development

Use Node 24 (CI also uses Node 24).

```sh
npm ci
npm run dev
```

Before opening a PR:

```sh
npm run check
npm run build
npm test
```

The tests read the production build, check local links and assets, and verify chapter navigation boundaries.

## Add an adventure

Create `src/content/adventures/my-adventure.md`. Its filename is its public URL slug:

```yaml
---
title: My Adventure
subtitle: A short evocative line.
description: A brief introduction for the library.
order: 3
setting: The forgotten realms
illustration:
  src: /images/my-adventure.webp
  alt: Describe the scene for someone who cannot see it.
  caption: Optional illustration caption.
---
Write the adventure introduction here in Markdown.
```

Add image files to `public/images/`. The current chronicle temporarily reuses concept artwork; replace it with original scene-specific illustrations as the real story evolves.

## Add a chapter

Create `src/content/chapters/my-adventure/a-new-beginning.md`:

```yaml
---
adventure: my-adventure
title: A New Beginning
summary: A sentence introducing this chapter.
order: 1
illustration:
  src: /images/my-chapter.webp
  alt: Describe the chapter illustration.
  caption: Optional caption.
---
The story begins here.

## A turn in the road

More story, images, and blockquotes can follow.
```

Chapters are sorted by `order` **within each adventure**, independent of filenames. Set `order: 0` for a prologue (displayed as **Prologue · Chapitre 0**). Set `sample: false` on real chapters so they do not show the placeholder notice. Use unique positive integer orders; gaps are allowed. The adventure reference must exist. The build rejects duplicate orders and chapter URLs. Pages, contents lists, breadcrumbs, and previous/next links are generated automatically. The last chapter links back to the adventure library, never into a different adventure. Each `##` heading becomes an on-page navigation link. The final filename is the chapter URL slug; keep it stable once published.

## GitHub Pages

The workflow follows `aubm/aubm-website`: npm on Node 24, PR validation, a build artifact, and `peaceiris/actions-gh-pages@v4` publishing `dist/` to `gh-pages` on pushes to `main`. Pull requests only validate; they do not deploy.

After merging the setup PR and the first successful workflow:

1. In **Settings → Pages**, select **Deploy from a branch**, **gh-pages**, **/ (root)**.
2. Set the custom domain to **the-campaign-trail.aubm.net** and enable **Enforce HTTPS** after the certificate is ready.
3. In DNS, create a CNAME record for `the-campaign-trail` pointing to `aubm.github.io` (not a repository URL).

The generated site includes `CNAME`. Astro's `site` is `https://the-campaign-trail.aubm.net`; no repository `base` path is needed with this custom domain. If publishing to a repository subpath instead, update the URL handling first.

## Artwork

`public/images/the-long-road.webp` is an original AI-generated concept illustration, made with the built-in image generation tool. It establishes a painterly fantasy direction without reusing official artwork. The full prompt is preserved in `ART_DIRECTION.md` for iteration.

## English and French

English keeps the original URLs (`/`, `/adventures/.../`). French uses the same paths under `/fr/`. The EN / FR switcher opens the equivalent page; normal navigation stays in the selected language. The site name stays **The Campaign Trail** in both languages. Language switching uses ordinary links and does not require JavaScript, cookies, or automatic browser-language detection.

Interface text is in `src/lib/i18n.ts`. Content translations are separate Markdown files with matching filenames:

| Content   | English                                                | French                                                    |
| --------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Adventure | `src/content/adventures/my-adventure.md`               | `src/content/adventures/fr/my-adventure.md`               |
| Chapter   | `src/content/chapters/my-adventure/a-new-beginning.md` | `src/content/chapters/fr/my-adventure/a-new-beginning.md` |

For each new adventure or chapter, add **both versions** in the same PR. When a translation is not ready, keep the matching page for valid navigation but set `translationPending: true` in its metadata and display a language notice rather than duplicating untranslated story text (as with the English prologue of *La Tombe de l’annihilation*). English defaults to `locale: en`. French must set `locale: fr`; a French chapter's adventure reference must include the prefix, e.g. `adventure: fr/my-adventure`. Translate titles, summaries, prose, captions, and image alt text when both versions are available; a French-only story may retain its French title in the English metadata while the description and availability notice are written in English. Images can be shared or differ between languages. Keep filenames and `order` values aligned so readers switch to the same point in the story.

The build rejects missing translation pairs, mismatched orders, and chapters referencing an adventure in a different language. Tests check reciprocal language links, canonical URLs, locale metadata, and chapter navigation in both languages. Each translated page has its own canonical URL and `hreflang` links.

GitHub Pages serves a single root 404 document. It includes the language switcher; a small script sends unknown `/fr/` paths to the French error page. Without JavaScript, the English error page still offers the French version.

## Adventures to play

`/play/` and `/fr/play/` showcase published, playable adventures separately from the campaign chronicles. The homepage features the first publication by `order`. Add both `src/content/publications/my-adventure.md` and `src/content/publications/fr/my-adventure.md` to list another publication; use the existing pair as a template.

Required frontmatter: `locale`, `title`, `subtitle`, `description`, unique positive `order`, `author`, `system`, `duration`, `levels`, `setting`, `shopUrl`, `previewUrl`, and `illustration` (`src`, `alt`, optional `caption`). Keep the same filename and order in both languages; the official product title may stay in its original language. The Markdown body is the presentation, not the full adventure. Localized catalogue, detail pages, language links, and navigation are generated automatically.

The first entry is **Escape the Dawn Warrior Island** by Aurélien Baumann. Its 2–3-hour duration, levels 1–2, shipwreck premise, and possible transition into _Tomb of Annihilation_ are supported by the publisher's [public English preview](https://d1vzi28wh99zvq.cloudfront.net/pdf_previews/450203-sample.pdf). Both languages link to DMs Guild and label the preview as an English PDF. The site does not mirror the product PDF or quote a potentially changing price. The new island illustration is original presentation artwork, not the published product cover.
