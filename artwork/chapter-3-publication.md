# Chapter 3 — La Sagesse des Mers

## Narrative source

- Selected source: [Notion script V3 — commentaires V2 intégrés](https://app.notion.com/p/4024a1a7e3e781c39d61ca04eaac4630).
- Source snapshot last edited: `2026-10-26T03:02:03.866Z`.
- French route: `/fr/adventures/la-tombe-de-l-annihilation/la-sagesse-des-mers/`.
- Chapter order: `3`, after *Les passagers*.

The six reader sequences are preserved, including the final underwater passage after the last illustration. Integration only removes production labels and notes, formats the section headings and dialogue paragraphs to match the site, and inserts figures. The narrative is not rewritten to match later visual staging choices. Editorial notes, uncertainties, research and generation prompts remain outside the published story.

The English counterpart uses the existing `translationPending` notice and links to the French original. It does not claim to contain an English translation. Earlier translated chapters are unchanged.

## Approved image selection

Originals: [chapter 3 Drive folder](https://drive.google.com/drive/folders/1VBM9ZEL84dq0G5Db-HP2yyNfGg6iZW8D).

| Scene | Final approved version | Placement |
| --- | --- | --- |
| I01 — Les poissons ont peut-être des choses à nous dire | V1 | Chapter hero; not duplicated in the body |
| I02 — Une invitée à quatre pattes | V2 | Adwayria meets Sagesse in the captain’s cabin |
| I03 — Le pain de Ghaar | V1 | The chewed bread returns to the communal basket |
| I04 — Les terres inconnues du Chult | V5 | Erdan examines the maps |
| I05 — Zaroum à l’horizon | V3 | Bran identifies the approaching ship |
| I06 — Les premiers grappins | V1 | The first boarding pirate reaches the deck |
| I07 — Jana au secours d’un marin | V2 | Jana treats the injured sailor |
| I08 — Zarraï, une ouverture décisive | V2 | Zarraï cuts the rope |
| I09 — Erdan et le malheureux Ghaar | V4 | Erdan’s attack and Ghaar’s mishap |
| I10 — La chute de Doran | V2 | Doran collapses against Adwayria |
| I11 — La colère d’Adwayria | V4 | Thunderwave throws the pirates overboard |
| I13 — Aremag surgit des profondeurs | V4 | The creature emerges between the vessels |
| I15 — La Sagesse des Mers se brise | V3 | The deck breaks apart beneath the travellers |

I12 was skipped by the author. I14 and I16 were not selected for this publication pass. These omissions do not remove their corresponding events from the narrative, and the original illustration numbers are retained.

## Asset processing

`chapter-3-sources.json` records the precise approved PNG filename, version, stable Drive link, original byte count, SHA-256 and dimensions, followed by each generated WebP variant and its own checksum.

Each approved PNG is used in full: no generation, cropping, repainting, compositing or identity correction during publication. Conversion uses Pillow 12.3.0, RGB WebP quality 90, method 6, with the original resolution and a 640-pixel-wide Lanczos-resized variant. Aspect ratios are preserved, including I01 at 1448 × 1086 and I13 at 1942 × 809.

The page provides descriptive alternative text, captions, explicit native dimensions, responsive `srcset`/`sizes`, and lazy asynchronous loading for body figures. The hero is loaded with high priority and its correct intrinsic ratio. No Drive image hotlink, temporary signed download URL or import credential is needed at runtime.

## Verification

`tests/chapter-3.test.mjs` is included in `npm test`. It checks the complete ending, six sections, absence of working notes, exact selected image order and versions, checksums, responsive variants, dimensions, accessibility attributes, translation-pending state, contents links and previous/next navigation. The existing preview test continues to verify deployment beneath the PR-preview base path.
