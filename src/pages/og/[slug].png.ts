import type { APIRoute } from 'astro';
import { FORMAT_LABELS, EVIDENCE_LABELS } from '../../config/site';
import { getRenderableArticles } from '../../lib/articles';
import { renderOgImage } from '../../lib/og-image';

export async function getStaticPaths() {
  const articles = await getRenderableArticles();
  return articles.map((article) => ({
    params: { slug: article.data.slug },
    props: { article },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { article } = props as Awaited<ReturnType<typeof getStaticPaths>>[number]['props'];
  const png = await renderOgImage({
    eyebrow: `${FORMAT_LABELS[article.data.format]} · ${EVIDENCE_LABELS[article.data.evidence]}`,
    title: article.data.title,
    subtitle: article.data.dek,
  });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
