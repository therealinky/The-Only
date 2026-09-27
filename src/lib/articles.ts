import { getCollection, type CollectionEntry } from 'astro:content';
import type { Discipline, Format } from '../config/site';

export type Article = CollectionEntry<'articles'>;

const showExamples = import.meta.env.DEV || import.meta.env.SHOW_EXAMPLES === 'true';

function isExampleHidden(entry: Article): boolean {
  return entry.data.example && !showExamples;
}

/** Articles whose page may exist at all: published + withdrawn always, draft only in local dev. */
export async function getRenderableArticles(): Promise<Article[]> {
  const all = await getCollection('articles');
  return all.filter((entry) => {
    if (isExampleHidden(entry)) return false;
    if (entry.data.status === 'draft' && !import.meta.env.DEV) return false;
    return true;
  });
}

/** Articles that may appear in listings, the tools index, the search index, and RSS. */
export async function getListableArticles(): Promise<Article[]> {
  const renderable = await getRenderableArticles();
  return renderable
    .filter((entry) => entry.data.status === 'published')
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const renderable = await getRenderableArticles();
  return renderable.find((entry) => entry.data.slug === slug);
}

export function filterByFormat(articles: Article[], format?: Format): Article[] {
  if (!format) return articles;
  return articles.filter((a) => a.data.format === format);
}

export function filterByDiscipline(articles: Article[], discipline?: Discipline): Article[] {
  if (!discipline) return articles;
  return articles.filter((a) => a.data.disciplines.includes(discipline));
}

export async function getAllTools(): Promise<string[]> {
  const listable = await getListableArticles();
  const tools = new Set<string>();
  for (const entry of listable) {
    for (const tool of entry.data.tools) tools.add(tool);
  }
  return [...tools].sort((a, b) => a.localeCompare(b));
}

export async function getArticlesByTool(tool: string): Promise<Article[]> {
  const listable = await getListableArticles();
  return listable.filter((entry) => entry.data.tools.includes(tool));
}
