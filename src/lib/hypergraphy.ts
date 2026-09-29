// "Hypergraphy" article hero art — a simple drawn motif whose outline is
// traced by the article's own words instead of a plain stroke, a nod to
// microscript/word-portrait art (an image built from dense handwritten
// text) without reproducing any specific existing artwork. Each article
// gets one central motif, chosen by discipline, deterministically
// generated from the article's slug so the same article always renders the
// same art (no hydration mismatch, no need to store an actual image file).
import type { Discipline } from '../config/site';

export const GRADIENT_VARIANTS = ['purple', 'rose', 'sage', 'blue', 'gold'] as const;
export type GradientVariant = (typeof GRADIENT_VARIANTS)[number];

// Pairs each variant with a second hue from the same decorative set used by
// page-hero gradients, so the wash always reads as "two hero hues", never a
// single flat color.
export const GRADIENT_PAIRS: Record<GradientVariant, [string, string]> = {
  purple: ['--hero-purple', '--hero-blue'],
  rose: ['--hero-rose', '--hero-gold'],
  sage: ['--hero-sage', '--hero-blue'],
  blue: ['--hero-blue', '--hero-purple'],
  gold: ['--hero-gold', '--hero-rose'],
};

type MotifKey = 'face' | 'chart' | 'reel' | 'browser' | 'seal' | 'ribbon' | 'cube';

// Every motif is authored in its own 0-100 unit box so it can be placed and
// scaled into the master canvas with a single transform. Each entry in
// `paths` becomes one outline traced by text; `fill` entries are small solid
// accent shapes (a pupil, a play triangle) too small to usefully carry text.
const MOTIFS: Record<MotifKey, { fill?: string[]; paths: string[] }> = {
  // UI/UX — a loose, single-line face profile (forehead, nose, lips, chin).
  face: {
    paths: [
      'M30,6 C44,4 54,8 58,18 C60,24 58,28 62,32 C74,36 82,40 78,46 C74,50 66,48 66,54 C66,58 60,58 62,62 C60,68 52,66 50,72 C44,80 32,80 26,74 C14,72 4,64 4,50 C4,32 12,12 30,6 Z',
      'M20,52 C16,54 16,60 20,62',
    ],
    fill: ['M46,26 m-2.3,0 a2.3,2.3 0 1,0 4.6,0 a2.3,2.3 0 1,0 -4.6,0'],
  },
  // Creative Coding — an uneven bar chart with a trend line over the top.
  chart: {
    paths: [
      'M16,85 L16,63',
      'M35,85 L35,48',
      'M54,85 L54,33',
      'M73,85 L73,52',
      'M92,85 L92,20',
      'M14,58 C28,46 40,50 52,30 C62,15 78,34 94,16',
    ],
  },
  // Motion & Video — a rounded frame, a play triangle, and film-tick marks.
  reel: {
    paths: [
      'M20,20 h52 a8,8 0 0 1 8,8 v44 a8,8 0 0 1 -8,8 h-52 a8,8 0 0 1 -8,-8 v-44 a8,8 0 0 1 8,-8 Z',
      'M9,26 L9,34',
      'M9,46 L9,54',
      'M9,66 L9,74',
    ],
    fill: ['M42,36 L42,64 L66,50 Z'],
  },
  // Web — a browser frame, traffic-light dots, and a wandering content line.
  browser: {
    paths: [
      'M10,15 h80 a6,6 0 0 1 6,6 v64 a6,6 0 0 1 -6,6 h-80 a6,6 0 0 1 -6,-6 v-64 a6,6 0 0 1 6,-6 Z',
      'M10,33 L96,33',
      'M18,60 C28,44 38,76 48,58 C58,42 68,70 82,50',
    ],
    fill: [
      'M22,24 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
      'M30,24 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
      'M38,24 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
    ],
  },
  // Brand — a two-circle seal with a diagonal mark through the overlap.
  seal: {
    paths: ['M38,50 m-26,0 a26,26 0 1,0 52,0 a26,26 0 1,0 -52,0', 'M62,50 m-26,0 a26,26 0 1,0 52,0 a26,26 0 1,0 -52,0', 'M36,26 L64,74'],
  },
  // Illustration — a single flowing brush stroke with an ink-blot accent.
  ribbon: {
    paths: ['M8,72 C24,18 46,92 60,38 C70,4 84,52 93,26'],
    fill: ['M93,22 m-3.2,0 a3.2,3.2 0 1,0 6.4,0 a3.2,3.2 0 1,0 -6.4,0'],
  },
  // 3D — an isometric wireframe cube, drawn face by face.
  cube: {
    paths: ['M50,15 L80,32 L50,49 L20,32 Z', 'M20,32 L20,68 L50,85 L50,49 Z', 'M50,49 L50,85 L80,68 L80,32 Z'],
  },
};

const DISCIPLINE_MOTIFS: Record<Discipline, MotifKey> = {
  Brand: 'seal',
  Web: 'browser',
  'UI/UX': 'face',
  'Motion & Video': 'reel',
  Illustration: 'ribbon',
  '3D': 'cube',
  'Creative Coding': 'chart',
};

export interface HypergraphicArt {
  gradientVariant: GradientVariant;
  motifPaths: { d: string; filled: boolean; text?: string }[];
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// mulberry32 — small, fast, deterministic PRNG seeded from the hash above.
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CANVAS_W = 800;
const CANVAS_H = 300;
const MOTIF_BOX = { x: 300, y: 40, w: 200, h: 220 };

// How much of the cleaned article text to pull for one outline's worth of
// text-on-path. Repeated below so a single excerpt comfortably covers even
// a long path at a small font size, rather than running out partway round.
const EXCERPT_LENGTH = 220;
const EXCERPT_REPEATS = 8;

/** Strips Markdown/MDX syntax down to plain prose, for tracing a path with. */
function cleanArticleText(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---/, '') // stray frontmatter, if any slipped through
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildHypergraphicArt(
  slug: string,
  disciplines: readonly Discipline[],
  articleBody: string,
): HypergraphicArt {
  const random = createRandom(hashString(slug));

  const motifKey = DISCIPLINE_MOTIFS[disciplines[0]] ?? 'seal';
  const motif = MOTIFS[motifKey];
  const cleaned = cleanArticleText(articleBody);

  const motifPaths = [
    ...motif.paths.map((d, i) => {
      // Offset which slice of the article's text each outline starts from,
      // so multiple outlines in one motif don't all repeat the same words
      // from the same starting point.
      const start = (i * 97) % Math.max(cleaned.length, 1);
      const slice = cleaned.length > 0 ? cleaned.slice(start) + ' ' + cleaned.slice(0, start) : '';
      const excerpt = slice.slice(0, EXCERPT_LENGTH) || 'the only';
      // A middle dot marks the loop point between repeats, never an em dash
      // (see the site's own voice guidance against them).
      const text = `${excerpt} · `.repeat(EXCERPT_REPEATS);
      return { d, filled: false, text };
    }),
    ...(motif.fill ?? []).map((d) => ({ d, filled: true })),
  ];

  const gradientVariant = GRADIENT_VARIANTS[Math.floor(random() * GRADIENT_VARIANTS.length)];

  return { gradientVariant, motifPaths };
}

export const HYPERGRAPHY_CANVAS = { width: CANVAS_W, height: CANVAS_H, motifBox: MOTIF_BOX };
