import { z } from "astro/zod";
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
const illustration = z.object({
  src: z.string().startsWith("/images/"),
  alt: z.string().min(1),
  caption: z.string().optional(),
});
const adventures = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/adventures" }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    description: z.string(),
    order: z.number().int().positive(),
    setting: z.string(),
    illustration,
  }),
});
const chapters = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/chapters" }),
  schema: z.object({
    adventure: reference("adventures"),
    title: z.string(),
    summary: z.string(),
    order: z.number().int().positive(),
    illustration,
  }),
});
export const collections = { adventures, chapters };
