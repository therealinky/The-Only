// The weekly digest: every published Brief, grouped into Monday-to-Sunday
// weeks. The site builds each week's digest page plus a copy-ready email
// version for sending by hand from Buttondown's free plan.
import { SITE } from '../config/site';
import { filterByFormat, getListableArticles, type Article } from './articles';
import { formatDate } from './format-date';

export interface DigestWeek {
  /** The week's Monday as YYYY-MM-DD, used in URLs. */
  slug: string;
  start: Date;
  articles: Article[];
}

// publishedAt is a date with no time, parsed as UTC midnight, so week math
// stays in UTC to avoid shifting an article into the neighboring week.
function mondayOf(date: Date): Date {
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - daysSinceMonday));
}

/** Weeks that have at least one published Brief, newest first. */
export async function getDigestWeeks(): Promise<DigestWeek[]> {
  const briefs = filterByFormat(await getListableArticles(), 'brief');
  const weeks = new Map<string, DigestWeek>();
  for (const article of briefs) {
    const start = mondayOf(article.data.publishedAt);
    const slug = start.toISOString().slice(0, 10);
    const week = weeks.get(slug) ?? { slug, start, articles: [] };
    week.articles.push(article);
    weeks.set(slug, week);
  }
  return [...weeks.values()].sort((a, b) => b.start.valueOf() - a.start.valueOf());
}

export function weekLabel(week: DigestWeek): string {
  return `Week of ${formatDate(week.start)}`;
}

export function digestPath(week: DigestWeek): string {
  return `/the-brief/digest/${week.slug}/`;
}

function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).href;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeMarkdownLinkText(value: string): string {
  return value.replace(/([[\]])/g, '\\$1');
}

export interface DigestEmail {
  subject: string;
  markdown: string;
  html: string;
}

export function buildDigestEmail(week: DigestWeek): DigestEmail {
  const intro = "Here's everything we published in The Brief this week.";
  const briefUrl = absoluteUrl('/the-brief/');
  const archiveUrl = absoluteUrl('/the-brief/digest/');
  const items = week.articles.map((article) => ({
    title: article.data.title,
    dek: article.data.dek,
    url: absoluteUrl(`/articles/${article.id}/`),
  }));

  const markdown = [
    intro,
    ...items.flatMap((item) => [`## [${escapeMarkdownLinkText(item.title)}](${item.url})`, item.dek]),
    '---',
    `Browse every Brief at [The Brief](${briefUrl}), or catch up on [past digests](${archiveUrl}).`,
  ].join('\n\n');

  const html = [
    `<p>${escapeHtml(intro)}</p>`,
    ...items.map(
      (item) =>
        `<h2><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></h2>\n<p>${escapeHtml(item.dek)}</p>`,
    ),
    '<hr>',
    `<p>Browse every Brief at <a href="${escapeHtml(briefUrl)}">The Brief</a>, or catch up on <a href="${escapeHtml(archiveUrl)}">past digests</a>.</p>`,
  ].join('\n');

  return { subject: `The Brief: week of ${formatDate(week.start)}`, markdown, html };
}
