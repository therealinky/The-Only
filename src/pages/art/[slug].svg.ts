import type { APIRoute } from 'astro';
import { getRenderableArticles } from '../../lib/articles';
import { renderStandaloneArt } from '../../lib/hypergraphy-svg';

export async function getStaticPaths() {
  const articles = await getRenderableArticles();
  return articles.map((article) => ({
    params: { slug: article.id },
    props: { article },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const { article } = props as Awaited<ReturnType<typeof getStaticPaths>>[number]['props'];
  const svg = renderStandaloneArt({
    slug: article.id,
    disciplines: article.data.disciplines,
    body: article.body ?? article.data.dek,
    art: article.data.art,
  });
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
