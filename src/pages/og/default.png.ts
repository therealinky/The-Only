import type { APIRoute } from 'astro';
import { SITE } from '../../config/site';
import { renderOgImage } from '../../lib/og-image';

export const GET: APIRoute = async () => {
  const png = await renderOgImage({
    title: SITE.name,
    subtitle: SITE.descriptor,
  });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
