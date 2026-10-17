import { z } from "astro/zod";
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
const illustration = z.object({
  src: z.string().startsWith("/images/"),
  alt: z.string().min(1),
  caption: z.string().optional(),
});
const adventures = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/adventures" }),
  schema: z.object({
    locale: z.enum(["en", "fr"]).default("en"),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    order: z.number().int().positive(),
    setting: z.string(),
    translationPending: z.boolean().default(false),
    illustration,
  }),
});
const chapters = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/chapters" }),
  schema: z.object({
    locale: z.enum(["en", "fr"]).default("en"),
    adventure: reference("adventures"),
    title: z.string(),
    summary: z.string(),
    order: z.number().int().nonnegative(),
    sample: z.boolean().default(true),
    translationPending: z.boolean().default(false),
    illustration,
  }),
});
const publications = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/publications" }),
  schema: z.object({
    locale: z.enum(["en", "fr"]).default("en"),
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    order: z.number().int().positive(),
    author: z.string(),
    system: z.string(),
    duration: z.string(),
    levels: z.string(),
    setting: z.string(),
    shopUrl: z.url(),
    previewUrl: z.url(),
    illustration,
  }),
});
export const collections = { adventures, chapters, publications };
