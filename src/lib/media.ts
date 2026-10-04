import type { ImageMetadata } from 'astro';

// Article media lives in a folder per article: src/assets/articles/<slug>/.
// Keystatic uploads there and stores the full path
// ("/src/assets/articles/<slug>/name.png"). A hand-written block can give
// just the filename instead, as long as no other article uses the same name.
export const MEDIA_DIRECTORY = 'src/assets/articles';

const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/articles/**/*.{png,jpg,jpeg,webp,gif,PNG,JPG,JPEG,WEBP,GIF}',
  { eager: true },
);
const lotties = import.meta.glob<string>('/src/assets/articles/**/*.{json,lottie}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const baseName = (path: string) => path.split('/').pop() ?? path;

function findAsset<T>(files: Record<string, T>, path: string, kind: string): { key: string; value: T } {
  const wanted = path.startsWith('/') ? path : `/${path}`;
  if (wanted in files) return { key: wanted, value: files[wanted] };
  const name = baseName(path);
  const matches = Object.keys(files).filter((candidate) => baseName(candidate) === name);
  if (matches.length === 1) return { key: matches[0], value: files[matches[0]] };
  if (matches.length > 1) {
    throw new Error(
      `Media block: more than one ${kind} is named "${name}" (${matches.join(', ')}). Use the full path, e.g. "${matches[0]}".`,
    );
  }
  throw new Error(
    `Media block: ${kind} "${path}" wasn't found. Put it in ${MEDIA_DIRECTORY}/<article-slug>/ (Keystatic does this for you) or fix the filename.`,
  );
}

export function resolveImage(path: string) {
  const { key, value } = findAsset(images, path, 'image');
  return { key, image: value.default, isGif: /\.gif$/i.test(key) };
}

export function resolveLottie(path: string) {
  const { key, value } = findAsset(lotties, path, 'Lottie file');
  return { key, url: value, isJson: /\.json$/i.test(key) };
}

// Accepts the usual YouTube link shapes: watch?v=, youtu.be/, /shorts/,
// /embed/, and /live/. Returns the 11-character video ID.
export function youTubeId(link: string): string {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    throw new Error(`Media block: "${link}" isn't a valid YouTube link.`);
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/)?.[1] ?? null;
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    throw new Error(`Media block: "${link}" isn't a YouTube video link the site recognizes.`);
  }
  return id;
}
