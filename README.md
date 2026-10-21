# The Campaign Trail

An illustrated journal of tabletop adventures, built with Astro and Markdown. The journal now contains **La Tombe de l’annihilation**, a real campaign chronicle beginning with the French prologue *Les ombres d’Omu*. The homepage reserves space for upcoming adventures instead of listing fictional examples. The prologue is also available in English as *Shadows of Omu*. The visual direction is a fantasy sourcebook: parchment, oxblood headings, gold accents, serif typography, and original painterly landscape art.

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

The workflow uses npm on Node 24, validates the production build, and uploads a build artifact. Pushes to `main` publish `dist/` to the root of `gh-pages`. Pull requests also build and publish a separate preview after validation.

After merging the setup PR and the first successful workflow:

1. In **Settings → Pages**, select **Deploy from a branch**, **gh-pages**, **/ (root)**.
2. Set the custom domain to **the-campaign-trail.aubm.net** and enable **Enforce HTTPS** after the certificate is ready.
3. In DNS, create a CNAME record for `the-campaign-trail` pointing to `aubm.github.io` (not a repository URL).

The generated site includes `CNAME`. Astro's `site` is `https://the-campaign-trail.aubm.net`; no repository `base` path is needed with this custom domain. If publishing to a repository subpath instead, update the URL handling first.

### Automatic pull request previews

Each open PR from a branch in this repository gets a stable URL:

```text
https://the-campaign-trail.aubm.net/pr-preview/pr-<number>/
https://the-campaign-trail.aubm.net/pr-preview/pr-<number>/fr/
```

The workflow creates or updates the preview on `opened`, `reopened`, and `synchronize` events, and posts its URL in a single updated PR comment. It waits for Pages deployment before posting the comment. Closing or merging the PR removes its preview and updates the comment. Preview URLs are public and temporary; they are not private review environments.

Pages must remain configured as **Deploy from a branch → gh-pages → / (root)**. The workflow requests `contents: write` and `pull-requests: write` only for preview deployment/removal, plus read access to Pages and Actions to wait for deployment. No additional service, DNS record, or secret is needed. Fork and Dependabot PRs still build and test but do not receive automatic deployments or comments because their tokens have restricted write permissions. The workflow uses `pull_request`, never executes fork code with `pull_request_target`, and builds in a separate read-only job.

The default-branch deployment preserves `pr-preview/` with `clean-exclude` and uses `force: false` to retain other deployments. Both deployment actions are pinned to commit SHAs. `public/CNAME` and `.nojekyll` stay at the production root; the PR artifact excludes `CNAME`. Deployment comments are provided by [PR Preview Action](https://github.com/rossjrw/pr-preview-action).

`PREVIEW_PR_NUMBER` enables Astro's `/pr-preview/pr-N/` base path. Helpers cover page navigation, language switches, image URLs and responsive image candidates; a Sätteri plugin covers links and HTML figures inside Markdown. Preview pages include `noindex, nofollow`, and Analytics is disabled even if a measurement ID is supplied locally. Production URLs and analytics behavior remain unchanged when the variable is unset.

To reproduce a preview locally:

```sh
PREVIEW_PR_NUMBER=18 npm run build
PREVIEW_PR_NUMBER=18 npm run test:preview
PREVIEW_PR_NUMBER=18 npm run preview
# Open http://localhost:4321/pr-preview/pr-18/fr/
```

Run the normal `npm run build && npm test` without `PREVIEW_PR_NUMBER` to return to the production build. PR validation runs both build modes. Existing PR branches should incorporate this workflow change and receive a new push to generate their first preview; merging this setup alone does not retroactively trigger their workflows.

## Google Analytics

Google Analytics 4 is optional. The shared layout adds the asynchronous Google tag to all English and French pages only when `PUBLIC_GA_MEASUREMENT_ID` is set for a production build. Development and GitHub Actions PR builds omit it. An empty value disables Analytics; a nonempty value must start with `G-` and contain only uppercase letters and numbers after the prefix, otherwise the production build fails with a configuration error.

### Set up the deployed site

1. In [Google Analytics](https://analytics.google.com/), create a GA4 property for **The Campaign Trail** and add a **Web** data stream for `https://the-campaign-trail.aubm.net`. See [Google's setup guide](https://support.google.com/analytics/answer/9304153?hl=en).
2. In **Admin → Data streams**, open the web stream and copy its **Measurement ID** (`G-…`).
3. In this repository's **Settings → Secrets and variables → Actions → Variables**, create a **repository variable** named `PUBLIC_GA_MEASUREMENT_ID` with that ID. Use a variable, not a secret: the ID is public in the generated HTML.
4. Merge this change. If it is already merged, run **Actions → Build and publish → Run workflow** on `main`. The ID is embedded at build time, so changing or removing it always requires a new build and deployment.
5. Once deployment finishes, visit the live site and use [Tag Assistant](https://tagassistant.google.com/) and Analytics' **Realtime** report to check traffic, including French pages and chapters. Initial data can take up to 30 minutes to appear.

There is no need to paste another tag or install Google Tag Manager. Normal page loads send a `page_view` through the standard GA4 configuration; installing a second copy would duplicate tracking.

### Verify locally

Copy `.env.example` to `.env`, set a measurement ID (prefer a separate test property), then run `npm run build` and `npm run preview`. Production previews with an ID send real Analytics data; `npm run dev` omits the tag even when an ID is present. Leave the value empty to build without Analytics. To disable the deployed tag, remove the repository variable and run the workflow on `main` again.

## Artwork

`public/images/the-long-road.webp` is an original AI-generated concept illustration, made with the built-in image generation tool. It establishes a painterly fantasy direction without reusing official artwork. The full prompt is preserved in `ART_DIRECTION.md` for iteration.

## English and French

English keeps the original URLs (`/`, `/adventures/.../`). French uses the same paths under `/fr/`. The EN / FR switcher opens the equivalent page; normal navigation stays in the selected language. The site name stays **The Campaign Trail** in both languages. Language switching uses ordinary links and does not require JavaScript, cookies, or automatic browser-language detection.

Interface text is in `src/lib/i18n.ts`. Content translations are separate Markdown files with matching filenames:

| Content   | English                                                | French                                                    |
| --------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Adventure | `src/content/adventures/my-adventure.md`               | `src/content/adventures/fr/my-adventure.md`               |
| Chapter   | `src/content/chapters/my-adventure/a-new-beginning.md` | `src/content/chapters/fr/my-adventure/a-new-beginning.md` |

For each new adventure or chapter, add **both versions** in the same PR. When a translation is not ready, keep the matching page for valid navigation but set `translationPending: true` in its metadata and display a language notice rather than duplicating untranslated story text. English defaults to `locale: en`. French must set `locale: fr`; a French chapter's adventure reference must include the prefix, e.g. `adventure: fr/my-adventure`. Translate titles, summaries, prose, captions, and image alt text when both versions are available; a French-only story may retain its French title in the English metadata while the description and availability notice are written in English. Images can be shared or differ between languages. Keep filenames and `order` values aligned so readers switch to the same point in the story.

The build rejects missing translation pairs, mismatched orders, and chapters referencing an adventure in a different language. Tests check reciprocal language links, canonical URLs, locale metadata, and chapter navigation in both languages. Each translated page has its own canonical URL and `hreflang` links.

GitHub Pages serves a single root 404 document. It includes the language switcher; a small script sends unknown `/fr/` paths to the French error page. Without JavaScript, the English error page still offers the French version.

## Adventures to play

`/play/` and `/fr/play/` showcase published, playable adventures separately from the campaign chronicles. The homepage features the first publication by `order`. Add both `src/content/publications/my-adventure.md` and `src/content/publications/fr/my-adventure.md` to list another publication; use the existing pair as a template.

Required frontmatter: `locale`, `title`, `subtitle`, `description`, unique positive `order`, `author`, `system`, `duration`, `levels`, `setting`, `shopUrl`, `previewUrl`, and `illustration` (`src`, `alt`, optional `caption`). Keep the same filename and order in both languages; the official product title may stay in its original language. The Markdown body is the presentation, not the full adventure. Localized catalogue, detail pages, language links, and navigation are generated automatically.

The first entry is **Escape the Dawn Warrior Island** by Aurélien Baumann. Its 2–3-hour duration, levels 1–2, shipwreck premise, and possible transition into _Tomb of Annihilation_ are supported by the publisher's [public English preview](https://d1vzi28wh99zvq.cloudfront.net/pdf_previews/450203-sample.pdf). Both languages link to DMs Guild and label the preview as an English PDF. The site does not mirror the product PDF or quote a potentially changing price. The new island illustration is original presentation artwork, not the published product cover.
