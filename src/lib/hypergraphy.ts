// "Hypergraphy" article hero art — a nod to the Lettrist idea of combining
// a simple drawn image with invented, sign-like marks scattered across it.
// Each article gets one central motif (chosen by discipline) surrounded by
// a scatter of small abstract glyphs, deterministically generated from the
// article's slug so the same article always renders the same art (no
// hydration mismatch, no need to store an actual image file).
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
// `paths` becomes one <path>/<circle>, drawn in on scroll, in order.
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

type GlyphKind = 'stroke' | 'dot';

const GLYPHS: { d: string; kind: GlyphKind }[] = [
  { d: 'M0,-8 L0,8 M-7,-4 L7,4 M-7,4 L7,-4', kind: 'stroke' }, // asterisk
  { d: 'M-8,0 C-4,-6 4,6 8,0', kind: 'stroke' }, // tilde
  { d: 'M0,0 m-6,0 a6,6 0 1,0 12,0 a6,6 0 1,0 -12,0', kind: 'stroke' }, // ring
  { d: 'M0,-7 L0,7 M-7,0 L7,0', kind: 'stroke' }, // cross
  { d: 'M-6,6 L6,-6', kind: 'stroke' }, // slash
  { d: 'M-8,4 L-3,-4 L3,4 L8,-4', kind: 'stroke' }, // zigzag
  { d: 'M-7,3 A8,8 0 0 1 7,3', kind: 'stroke' }, // arc
  { d: 'M0,0 m-2.5,0 a2.5,2.5 0 1,0 5,0 a2.5,2.5 0 1,0 -5,0', kind: 'dot' }, // dot
  // Script-like marks — loops and swashes reminiscent of handwriting
  // texture, invented rather than legible letterforms, in keeping with
  // "hypergraphy" as sign-making rather than actual text.
  { d: 'M-6,4 C-6,-4 6,-4 6,2 C6,8 -2,6 -3,0 C-4,-4 2,-6 4,-2', kind: 'stroke' }, // loop
  { d: 'M-8,-3 C-2,-8 2,6 8,3', kind: 'stroke' }, // swash
  { d: 'M-7,2 C-4,-6 -1,6 2,-4 C4,-9 6,3 8,-2', kind: 'stroke' }, // scribble
  { d: 'M-5,-6 C-8,0 -2,7 4,4 C7,2 6,-2 3,-1', kind: 'stroke' }, // hook
];

interface GlyphInstance {
  d: string;
  kind: GlyphKind;
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

export interface HypergraphicArt {
  gradientVariant: GradientVariant;
  motifPaths: { d: string; filled: boolean }[];
  glyphs: GlyphInstance[];
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

const GLYPH_COUNT = 22;
const CANVAS_W = 800;
const CANVAS_H = 300;
// The motif occupies this box in canvas space; glyphs bias away from it.
const MOTIF_BOX = { x: 300, y: 40, w: 200, h: 220 };

export function buildHypergraphicArt(slug: string, disciplines: readonly Discipline[]): HypergraphicArt {
  const random = createRandom(hashString(slug));

  const motifKey = DISCIPLINE_MOTIFS[disciplines[0]] ?? 'seal';
  const motif = MOTIFS[motifKey];
  const motifPaths = [
    ...motif.paths.map((d) => ({ d, filled: false })),
    ...(motif.fill ?? []).map((d) => ({ d, filled: true })),
  ];

  const gradientVariant = GRADIENT_VARIANTS[Math.floor(random() * GRADIENT_VARIANTS.length)];

  const glyphs: GlyphInstance[] = Array.from({ length: GLYPH_COUNT }, () => {
    const glyph = GLYPHS[Math.floor(random() * GLYPHS.length)];
    // Bias positions toward the margins so glyphs scatter around the motif
    // instead of sitting on top of it.
    const onLeft = random() < 0.5;
    const x = onLeft
      ? random() * (MOTIF_BOX.x - 30) + 15
      : random() * (CANVAS_W - MOTIF_BOX.x - MOTIF_BOX.w - 30) + MOTIF_BOX.x + MOTIF_BOX.w + 15;
    const y = random() * (CANVAS_H - 40) + 20;
    return {
      d: glyph.d,
      kind: glyph.kind,
      x,
      y,
      rotate: Math.floor(random() * 360),
      scale: 0.45 + random() * 0.75,
    };
  });

  return { gradientVariant, motifPaths, glyphs };
}

export const HYPERGRAPHY_CANVAS = { width: CANVAS_W, height: CANVAS_H, motifBox: MOTIF_BOX };
