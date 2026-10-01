import { getCollection, type CollectionEntry } from 'astro:content';
import type { Discipline, Format } from '../config/site';

export type Article = CollectionEntry<'articles'>;

const showExamples = import.meta.env.DEV || import.meta.env.SHOW_EXAMPLES === 'true';

function isExampleHidden(entry: Article): boolean {
  return entry.data.example && !showExamples;
}

// Every article's illustration must be its own, so two articles sharing an
// `art` motif fails the build (and the dev server) with both named.
function assertUniqueArt(entries: Article[]) {
  const owners = new Map<string, string>();
  for (const entry of entries) {
    const owner = owners.get(entry.data.art);
    if (owner) {
      throw new Error(
        `"${entry.id}" and "${owner}" both use the "${entry.data.art}" art motif. Each article needs its own: pick an unused motif or add a new one (see src/lib/hypergraphy.ts).`,
      );
    }
    owners.set(entry.data.art, entry.id);
  }
}

/** Articles whose page may exist at all: published + withdrawn always, draft only in local dev. */
export async function getRenderableArticles(): Promise<Article[]> {
  const all = await getCollection('articles');
  const renderable = all.filter((entry) => {
    if (isExampleHidden(entry)) return false;
    if (entry.data.status === 'draft' && !import.meta.env.DEV) return false;
    return true;
  });
  assertUniqueArt(renderable);
  return renderable;
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
  return renderable.find((entry) => entry.id === slug);
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
