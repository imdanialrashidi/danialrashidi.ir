import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    faTitle: z.string().optional(),
    description: z.string(),
    year: z.string(),
    status: z.string(),
    technologies: z.array(z.string()),
    liveUrl: z.url().optional(),
    githubUrl: z.url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(99),
    monogram: z.string().default("د"),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
  }),
});

const travels = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/travels" }),
  schema: z.object({
    destination: z.string(),
    date: z.string(),
    description: z.string(),
    instagramUrl: z.url().optional(),
    order: z.number().default(99),
    monogram: z.string().default("س"),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    imageWidth: z.number().optional(),
    imageHeight: z.number().optional(),
    imagePosition: z.string().optional(),
  }),
});

export const collections = { projects, travels };
