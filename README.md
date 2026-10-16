# The Campaign Trail

An illustrated journal of tabletop adventures, built with Astro and Markdown. The first version includes two **fictional sample adventures** and five placeholder chapters. The visual direction is a fantasy sourcebook: parchment, oxblood headings, gold accents, serif typography, and original painterly landscape art.

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

Add image files to `public/images/`. All current sample pages deliberately reuse one concept illustration; replace each illustration independently as the real story arrives.

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

Chapters are sorted by `order` **within each adventure**, independent of filenames. Use unique positive integer orders; gaps are allowed. The adventure reference must exist. The build rejects duplicate orders and chapter URLs. Pages, contents lists, breadcrumbs, and previous/next links are generated automatically. The last chapter links back to the adventure library, never into a different adventure. Each `##` heading becomes an on-page navigation link. The final filename is the chapter URL slug; keep it stable once published.

## GitHub Pages

The workflow follows `aubm/aubm-website`: npm on Node 24, PR validation, a build artifact, and `peaceiris/actions-gh-pages@v4` publishing `dist/` to `gh-pages` on pushes to `main`. Pull requests only validate; they do not deploy.

After merging the setup PR and the first successful workflow:

1. In **Settings → Pages**, select **Deploy from a branch**, **gh-pages**, **/ (root)**.
2. Set the custom domain to **the-campaign-trail.aubm.net** and enable **Enforce HTTPS** after the certificate is ready.
3. In DNS, create a CNAME record for `the-campaign-trail` pointing to `aubm.github.io` (not a repository URL).

The generated site includes `CNAME`. Astro's `site` is `https://the-campaign-trail.aubm.net`; no repository `base` path is needed with this custom domain. If publishing to a repository subpath instead, update the URL handling first.

## Artwork

`public/images/the-long-road.webp` is an original AI-generated concept illustration, made with the built-in image generation tool. It establishes a painterly fantasy direction without reusing official artwork. The full prompt is preserved in `ART_DIRECTION.md` for iteration.
