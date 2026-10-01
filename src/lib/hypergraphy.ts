// "Hypergraphy" article art: a character-grid composition of two motifs
// chosen for the article's subject (its frontmatter `art` field), drawn
// across the full banner and deterministically generated from the slug, so
// the same article always renders the same art.
//
// Two techniques:
// - hybrid: crisp line-drawing edges (glyphs chosen by edge direction, box
//   corners where lines meet), with the article's own words filling each
//   region at that region's tone.
// - shading: every cell's coverage and region tone picks a glyph by visual
//   weight, so faces read as solid and dimensional. Used for the cube.
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

export const ART_MOTIFS = [
  'agent',
  'bolt',
  'browser',
  'bubbles',
  'camera',
  'cards',
  'chat',
  'clapper',
  'cloud',
  'code',
  'coins',
  'cube',
  'document',
  'face',
  'grid',
  'image',
  'layers',
  'nodes',
  'pen',
  'phone',
  'plug',
  'ratios',
  'reel',
  'ribbon',
  'seal',
  'sliders',
  'sparkle',
  'swatches',
  'timeline',
  'wand',
  'waveform',
  'wheel',
] as const;
export type ArtMotif = (typeof ART_MOTIFS)[number];

export interface ArticleArt {
  primary: ArtMotif;
  secondary?: ArtMotif;
}

interface Pt {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  size: number;
}

type Technique = 'hybrid' | 'shading';

// How the hybrid technique draws a fill: a single mark, words packed inside
// it, or its outline with words inside.
type FillKind = 'dot' | 'solid' | 'outline';

// Motifs are authored in a 0-100 unit square. `tone` (0-1) is how dark a
// region reads: it drives the shading ramp directly, and in the hybrid it
// sets how strongly the article's words show inside that region. Overlapping
// tones add.
interface Motif {
  fills: { points: Pt[]; kind: FillKind; tone: number }[];
  strokes: Pt[][];
  tones: { points: Pt[]; tone: number }[];
  strokeTone?: number;
  technique?: Technique;
  // Hybrid only: for a motif that's all line and no region (the ribbon), words
  // run in a band this many cells either side of the stroke instead.
  wordBand?: number;
}

function poly(flat: number[]): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] });
  return points;
}

function box(x1: number, y1: number, x2: number, y2: number): Pt[] {
  return poly([x1, y1, x2, y1, x2, y2, x1, y2]);
}

// Closed back to its start point, so it draws as four edges rather than three.
function frame(x1: number, y1: number, x2: number, y2: number): Pt[] {
  return poly([x1, y1, x2, y1, x2, y2, x1, y2, x1, y1]);
}

function circle(cx: number, cy: number, r: number, segments = 36): Pt[] {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
}

function ring(cx: number, cy: number, r: number): Pt[] {
  return closeLoop(circle(cx, cy, r));
}

// A four-pointed sparkle: long points at the compass directions, pinched in
// between.
function star4(cx: number, cy: number, outer: number, inner: number): Pt[] {
  return poly([
    cx, cy - outer, cx + inner, cy - inner, cx + outer, cy, cx + inner, cy + inner,
    cx, cy + outer, cx - inner, cy + inner, cx - outer, cy, cx - inner, cy - inner,
  ]);
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, samples = 28): Pt[] {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const mt = 1 - t;
    return {
      x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
      y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
    };
  });
}

// A ring segment between two radii, for the color wheel.
function wedge(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, steps = 6): Pt[] {
  const arc = (r: number) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const a = a0 + ((a1 - a0) * i) / steps;
      return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
    });
  return [...arc(r1), ...arc(r0).reverse()];
}

function closeLoop(points: Pt[]): Pt[] {
  const first = points[0];
  const last = points[points.length - 1];
  return first.x === last.x && first.y === last.y ? points : [...points, first];
}

const outline = (points: Pt[], tone: number) => ({ points, kind: 'outline' as const, tone });
const dot = (cx: number, cy: number, r = 2.2) => ({ points: circle(cx, cy, r, 12), kind: 'dot' as const, tone: 1 });
const region = (points: Pt[], tone: number) => ({ points, tone });

const FACE_PROFILE = poly([
  26, 6, 40, 6, 50, 12, 53, 20, 51, 26, 67, 34, 57, 38, 61, 44, 55, 48, 58, 56, 47, 62, 41, 66, 33, 80, 18, 78, 8, 58,
  6, 30, 12, 14, 26, 6,
]);
const CAMERA_BODY = poly([8, 30, 30, 30, 36, 20, 58, 20, 64, 30, 92, 30, 92, 82, 8, 82, 8, 30]);
const PAGE = poly([18, 6, 66, 6, 84, 24, 84, 94, 18, 94]);
const CLOUD = poly([
  14, 72, 8, 62, 10, 52, 20, 46, 26, 46, 28, 36, 36, 28, 48, 24, 60, 28, 68, 36, 72, 42, 80, 40, 88, 44, 94, 54, 92, 64,
  84, 72,
]);
const WAVE_HEIGHTS = [10, 22, 34, 18, 42, 30, 46, 26, 38, 14, 30, 44, 20, 28, 12];
const WHEEL_TONES = [0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.84, 0.96];

function card(x: number): Motif {
  return {
    fills: [outline(box(x + 4, 72, x + 20, 80), 0.7)],
    strokes: [frame(x, 18, x + 24, 84), poly([x, 44, x + 24, 44])],
    tones: [region(box(x, 18, x + 24, 44), 0.4), region(box(x, 44, x + 24, 84), 0.12)],
  };
}

function merge(...motifs: Motif[]): Motif {
  return {
    fills: motifs.flatMap((m) => m.fills),
    strokes: motifs.flatMap((m) => m.strokes),
    tones: motifs.flatMap((m) => m.tones),
  };
}

const MOTIFS: Record<ArtMotif, Motif> = {
  // A robot head: antenna, square eyes, mouth, and ears.
  agent: {
    fills: [
      outline(box(22, 30, 78, 82), 0.15),
      outline(box(34, 44, 44, 56), 1),
      outline(box(56, 44, 66, 56), 1),
      outline(circle(50, 12, 4, 16), 0.9),
    ],
    strokes: [poly([50, 30, 50, 16]), poly([38, 68, 62, 68]), frame(14, 46, 22, 66), frame(78, 46, 86, 66)],
    tones: [],
  },
  // A lightning bolt with spark marks: speed.
  bolt: {
    fills: [outline(poly([60, 4, 22, 56, 46, 56, 36, 96, 80, 40, 56, 40, 68, 4]), 0.7)],
    strokes: [poly([82, 14, 90, 6]), poly([86, 26, 96, 24]), poly([16, 78, 8, 86])],
    tones: [],
  },
  // A browser window: traffic lights, address bar, hero block, three cards.
  browser: {
    fills: [dot(16, 19, 1.8), dot(22, 19, 1.8), dot(28, 19, 1.8)],
    strokes: [
      frame(8, 12, 92, 88),
      poly([8, 26, 92, 26]),
      frame(36, 16, 84, 22),
      frame(16, 32, 84, 54),
      frame(16, 60, 36, 82),
      frame(40, 60, 60, 82),
      frame(64, 60, 84, 82),
    ],
    tones: [
      region(box(8, 12, 92, 26), 0.42),
      region(box(16, 32, 84, 54), 0.35),
      region(box(16, 60, 36, 82), 0.2),
      region(box(40, 60, 60, 82), 0.2),
      region(box(64, 60, 84, 82), 0.2),
    ],
  },
  // Three speech bubbles: a community talking.
  bubbles: {
    fills: [
      outline(poly([6, 10, 54, 10, 54, 40, 22, 40, 14, 50, 16, 40, 6, 40]), 0.3),
      outline(poly([40, 46, 94, 46, 94, 74, 82, 74, 86, 84, 74, 74, 40, 74]), 0.5),
      outline(box(10, 80, 46, 96), 0.2),
    ],
    strokes: [],
    tones: [],
  },
  // A camera body with a viewfinder hump, flash window, shutter button, and
  // a two-ring lens whose words get denser toward the center.
  camera: {
    fills: [outline(circle(50, 56, 19), 0.35), outline(circle(50, 56, 10), 0.4), dot(80, 25, 2.4)],
    strokes: [closeLoop(CAMERA_BODY), frame(15, 37, 25, 43)],
    tones: [region(CAMERA_BODY, 0.12)],
  },
  // Three identical UI cards in a row.
  cards: merge(card(6), card(38), card(70)),
  // A speech bubble with a smaller reply.
  chat: {
    fills: [
      outline(poly([8, 12, 92, 12, 92, 64, 44, 64, 26, 84, 30, 64, 8, 64]), 0.22),
      outline(poly([56, 72, 92, 72, 92, 92, 66, 92, 58, 98, 60, 92, 56, 92]), 0.45),
    ],
    strokes: [],
    tones: [],
  },
  // A clapperboard: striped hinged stick over a slate.
  clapper: {
    fills: [outline(box(12, 42, 88, 90), 0.15)],
    strokes: [
      poly([12, 30, 86, 16, 88, 28, 12, 40, 12, 30]),
      poly([28, 27, 32, 37]),
      poly([46, 24, 50, 34]),
      poly([64, 20, 68, 30]),
      poly([12, 58, 88, 58]),
      poly([50, 58, 50, 90]),
      poly([22, 42, 30, 58]),
      poly([40, 42, 48, 58]),
      poly([58, 42, 66, 58]),
      poly([76, 42, 84, 58]),
    ],
    tones: [region(box(12, 58, 50, 90), 0.25)],
  },
  // A cloud with an upload arrow.
  cloud: {
    fills: [outline(CLOUD, 0.2)],
    strokes: [poly([50, 66, 50, 40]), poly([40, 50, 50, 40, 60, 50])],
    tones: [],
  },
  // A code window with </> over the code.
  code: {
    fills: [dot(13, 16, 1.6), dot(19, 16, 1.6), dot(25, 16, 1.6)],
    strokes: [
      frame(6, 10, 94, 90),
      poly([6, 22, 94, 22]),
      poly([36, 38, 22, 56, 36, 74]),
      poly([64, 38, 78, 56, 64, 74]),
      poly([56, 34, 44, 78]),
    ],
    tones: [region(box(6, 22, 94, 90), 0.14)],
  },
  // A coin with a sparkle in the middle, and a second coin: AI credits.
  coins: {
    fills: [
      outline(circle(40, 54, 34), 0.3),
      outline(circle(40, 54, 25), 0.25),
      outline(star4(40, 54, 14, 3.5), 0.45),
      outline(circle(82, 24, 15), 0.5),
    ],
    strokes: [],
    tones: [],
  },
  // An isometric cube, lit from above, so each face gets its own tone.
  cube: {
    fills: [],
    strokes: [
      poly([50, 15, 80, 32, 80, 68, 50, 85, 20, 68, 20, 32, 50, 15]),
      poly([50, 49, 80, 32]),
      poly([50, 49, 20, 32]),
      poly([50, 49, 50, 85]),
    ],
    tones: [
      region(poly([50, 15, 80, 32, 50, 49, 20, 32]), 0.14),
      region(poly([20, 32, 50, 49, 50, 85, 20, 68]), 0.45),
      region(poly([50, 49, 80, 32, 80, 68, 50, 85]), 0.78),
    ],
    strokeTone: 0.95,
    technique: 'shading',
  },
  // A page with a folded corner and a headline block.
  document: {
    fills: [],
    strokes: [closeLoop(PAGE), poly([66, 6, 66, 24, 84, 24])],
    tones: [region(PAGE, 0.18), region(box(26, 32, 62, 40), 0.6)],
  },
  // A profile (forehead, nose, lips, chin), an eye, and an ear mark.
  face: {
    fills: [dot(40, 22, 2.6)],
    strokes: [FACE_PROFILE, poly([16, 50, 13, 53, 13, 58, 16, 61]), poly([33, 16, 46, 15])],
    tones: [region(FACE_PROFILE, 0.16)],
  },
  // A 3x3 icon grid with a few small marks.
  grid: {
    fills: [10, 39, 68].flatMap((y, row) =>
      [10, 39, 68].map((x, col) => outline(box(x, y, x + 22, y + 22), [0.1, 0.3, 0.5][(row + col) % 3])),
    ),
    strokes: [ring(21, 21, 6), poly([79, 73, 86, 85, 72, 85, 79, 73]), poly([50, 44, 50, 56]), poly([44, 50, 56, 50])],
    tones: [],
  },
  // A picture: mountains, a sun, and sky.
  image: {
    fills: [outline(circle(72, 32, 7, 20), 0.9)],
    strokes: [frame(8, 14, 92, 86), poly([10, 84, 34, 48, 50, 68, 64, 54, 90, 84])],
    tones: [region(box(8, 14, 92, 86), 0.08), region(poly([8, 86, 34, 48, 50, 68, 64, 54, 92, 86]), 0.55)],
  },
  // A stack of layers: a diamond with two chevrons below it.
  layers: {
    fills: [outline(poly([50, 14, 88, 32, 50, 50, 12, 32]), 0.5)],
    strokes: [poly([12, 46, 50, 64, 88, 46]), poly([12, 60, 50, 78, 88, 60])],
    tones: [
      region(poly([12, 32, 50, 50, 88, 32, 88, 46, 50, 64, 12, 46]), 0.22),
      region(poly([12, 46, 50, 64, 88, 46, 88, 60, 50, 78, 12, 60]), 0.1),
    ],
  },
  // A node graph: two inputs wired into one output.
  nodes: {
    fills: [outline(box(6, 12, 36, 34), 0.35), outline(box(6, 64, 36, 86), 0.35), outline(box(62, 38, 94, 60), 0.55)],
    strokes: [poly([36, 23, 49, 23, 49, 49, 62, 49]), poly([36, 75, 49, 75, 49, 49])],
    tones: [],
  },
  // A bezier curve with its anchor points and handles: vector drawing.
  pen: {
    fills: [
      outline(box(6, 74, 14, 82), 0.9),
      outline(box(86, 20, 94, 28), 0.9),
      dot(30, 10, 2.4),
      dot(70, 95, 2.4),
    ],
    strokes: [
      cubic({ x: 10, y: 78 }, { x: 30, y: 10 }, { x: 70, y: 95 }, { x: 90, y: 24 }),
      poly([10, 78, 30, 10]),
      poly([90, 24, 70, 95]),
    ],
    tones: [],
  },
  // A phone: screen with a header, a card, and a list.
  phone: {
    fills: [dot(38, 19, 2)],
    strokes: [
      frame(28, 4, 72, 96),
      poly([44, 9, 56, 9]),
      poly([44, 92, 56, 92]),
      frame(32, 14, 68, 86),
      poly([32, 24, 68, 24]),
      frame(36, 30, 64, 50),
      poly([36, 62, 64, 62]),
      poly([36, 72, 64, 72]),
    ],
    tones: [region(box(32, 14, 68, 24), 0.4), region(box(36, 30, 64, 50), 0.35), region(box(32, 54, 68, 86), 0.12)],
  },
  // A plug with prongs and a cable: integrations and MCP connectors.
  plug: {
    fills: [outline(box(30, 38, 70, 70), 0.35)],
    strokes: [
      frame(37, 18, 43, 38),
      frame(57, 18, 63, 38),
      poly([30, 70, 38, 80, 62, 80, 70, 70]),
      poly([50, 80, 50, 88, 66, 96, 94, 96]),
    ],
    tones: [],
  },
  // Nested frames of different aspect ratios sharing one corner.
  ratios: {
    fills: [],
    strokes: [frame(10, 10, 38, 90), frame(10, 42, 70, 90), frame(10, 60, 94, 90)],
    tones: [region(box(10, 10, 38, 90), 0.12), region(box(10, 42, 70, 90), 0.12), region(box(10, 60, 94, 90), 0.12)],
  },
  // A film frame with a play button and sprocket ticks both sides.
  reel: {
    fills: [{ points: poly([40, 33, 40, 67, 68, 50]), kind: 'solid', tone: 1 }],
    strokes: [
      frame(14, 20, 86, 72),
      poly([9, 26, 9, 34]),
      poly([9, 46, 9, 54]),
      poly([9, 66, 9, 74]),
      poly([91, 26, 91, 34]),
      poly([91, 46, 91, 54]),
      poly([91, 66, 91, 74]),
    ],
    tones: [region(box(14, 20, 86, 72), 0.12)],
  },
  // A single flowing brush stroke with an ink-blot accent.
  ribbon: {
    fills: [dot(93, 22, 3.4)],
    strokes: [poly([8, 72, 24, 18, 46, 92, 60, 38, 70, 4, 84, 52, 93, 26])],
    tones: [],
    wordBand: 2.2,
  },
  // Two overlapping circles and a diagonal mark: a brand seal. The overlap
  // has to be several cells wide, or both arcs and the mark land in one
  // noisy column.
  seal: {
    fills: [outline(circle(34, 50, 23), 0.4), outline(circle(66, 50, 23), 0.6)],
    strokes: [poly([30, 24, 70, 76])],
    tones: [],
  },
  // Three slider tracks with knobs: editing controls.
  sliders: {
    fills: [outline(box(26, 15, 36, 29), 0.9), outline(box(60, 43, 70, 57), 0.9), outline(box(40, 71, 50, 85), 0.9)],
    strokes: [
      poly([10, 22, 26, 22]),
      poly([36, 22, 90, 22]),
      poly([10, 50, 60, 50]),
      poly([70, 50, 90, 50]),
      poly([10, 78, 40, 78]),
      poly([50, 78, 90, 78]),
    ],
    tones: [],
  },
  // A big sparkle with two small ones: generative AI.
  sparkle: {
    fills: [outline(star4(46, 54, 40, 9), 0.5), outline(star4(82, 18, 12, 3), 0.8), dot(84, 82, 2.4)],
    strokes: [],
    tones: [],
  },
  // A palette of six color chips, light to dark.
  swatches: {
    fills: [16, 52].flatMap((y, row) =>
      [12, 40, 68].map((x, col) => outline(box(x, y, x + 24, y + 28), [0.12, 0.3, 0.48, 0.66, 0.84, 1][row * 3 + col])),
    ),
    strokes: [],
    tones: [],
  },
  // An editing timeline: ruler ticks, three lanes of clips, and a playhead.
  timeline: {
    fills: [outline(poly([61, 6, 71, 6, 66, 12]), 1)],
    strokes: [
      frame(6, 22, 94, 38),
      frame(6, 44, 94, 60),
      frame(6, 66, 94, 82),
      poly([66, 12, 66, 90]),
      ...[10, 20, 30, 40, 50, 60, 70, 80, 90].map((x) => poly([x, 15, x, 18])),
    ],
    tones: [
      region(box(10, 25, 42, 35), 0.75),
      region(box(48, 25, 62, 35), 0.45),
      region(box(14, 47, 52, 57), 0.55),
      region(box(58, 47, 88, 57), 0.3),
      region(box(22, 69, 70, 79), 0.4),
    ],
  },
  // A magic wand with sparkles at the tip.
  wand: {
    fills: [outline(poly([10, 84, 16, 90, 70, 36, 64, 30]), 0.55), outline(star4(80, 18, 13, 3), 0.9), dot(90, 44), dot(56, 12)],
    strokes: [poly([56, 40, 62, 46])],
    tones: [],
  },
  // An audio waveform.
  waveform: {
    fills: [],
    strokes: WAVE_HEIGHTS.map((h, i) => poly([8 + i * 6, 50 - h, 8 + i * 6, 50 + h])),
    tones: [],
  },
  // A color wheel: eight wedges, light to dark, between two rings.
  wheel: {
    fills: [],
    strokes: [
      ring(50, 50, 42),
      ring(50, 50, 12),
      ...WHEEL_TONES.map((_, i) => {
        const a = (i / WHEEL_TONES.length) * Math.PI * 2;
        return [
          { x: 50 + Math.cos(a) * 12, y: 50 + Math.sin(a) * 12 },
          { x: 50 + Math.cos(a) * 42, y: 50 + Math.sin(a) * 42 },
        ];
      }),
    ],
    tones: WHEEL_TONES.map((tone, i) =>
      region(
        wedge(50, 50, 12, 42, (i / WHEEL_TONES.length) * Math.PI * 2, ((i + 1) / WHEEL_TONES.length) * Math.PI * 2),
        tone,
      ),
    ),
  },
};

// Used only when an article has no `art` set.
const DISCIPLINE_DEFAULTS: Record<Discipline, ArtMotif> = {
  Brand: 'seal',
  Web: 'browser',
  'UI/UX': 'face',
  'Motion & Video': 'reel',
  'Photo & Imaging': 'camera',
  Illustration: 'ribbon',
  '3D': 'cube',
};

const CANVAS_W = 800;
const CANVAS_H = 420;
// Cells are tall (5.56 x 10 canvas units), the proportion of a terminal cell,
// which is what box-drawing glyphs expect.
export const GRID_COLS = 144;
export const GRID_ROWS = 42;
const CELL_W = CANVAS_W / GRID_COLS;
const CELL_H = CANVAS_H / GRID_ROWS;

export const HYPERGRAPHY_CANVAS = { width: CANVAS_W, height: CANVAS_H, cellW: CELL_W, cellH: CELL_H };

// Where the primary and secondary motif sit on the banner; picked per slug.
const LAYOUTS: { primary: Box; secondary: Box }[] = [
  { primary: { x: 70, y: 40, size: 340 }, secondary: { x: 500, y: 75, size: 200 } },
  { primary: { x: 390, y: 40, size: 340 }, secondary: { x: 110, y: 150, size: 200 } },
  { primary: { x: 230, y: 40, size: 340 }, secondary: { x: 590, y: 200, size: 170 } },
];
const SOLO_LAYOUT: Box = { x: 230, y: 40, size: 340 };

// Ordered by visual weight, lightest to heaviest.
const SHADE_RAMP = ' .:-=+*#%@';

// Box-drawing glyph for each combination of neighbors a cell's lines connect
// to (Left, Right, Up, Down).
const BOX_GLYPHS: Record<string, string> = {
  L: '─',
  R: '─',
  LR: '─',
  U: '│',
  D: '│',
  UD: '│',
  RD: '┌',
  LD: '┐',
  RU: '└',
  LU: '┘',
  LRD: '┬',
  LRU: '┴',
  RUD: '├',
  LUD: '┤',
  LRUD: '┼',
};

export type HgLayerKind = 'detail' | 'words-light' | 'words-mid' | 'words-strong' | 'shade' | 'line';

export interface HgLayer {
  kind: HgLayerKind;
  rows: string[];
}

export interface HypergraphicArt {
  gradientVariant: GradientVariant;
  layers: HgLayer[];
}

function pointInPolygon(p: Pt, polygon: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { x: xi, y: yi } = polygon[i];
    const { x: xj, y: yj } = polygon[j];
    const intersects = yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function distToPolyline(p: Pt, line: Pt[]): number {
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) min = Math.min(min, distToSegment(p, line[i], line[i + 1]));
  return min;
}

// Maps a motif from its 0-100 square into a box on the canvas.
function place(motif: Motif, at: Box): Motif {
  const map = (points: Pt[]) => points.map((p) => ({ x: at.x + (p.x * at.size) / 100, y: at.y + (p.y * at.size) / 100 }));
  return {
    ...motif,
    fills: motif.fills.map((f) => ({ ...f, points: map(f.points) })),
    strokes: motif.strokes.map(map),
    tones: motif.tones.map((t) => ({ ...t, points: map(t.points) })),
  };
}

function regionTone(p: Pt, motif: Motif, skipDots: boolean): number {
  let tone = 0;
  for (const fill of motif.fills) {
    if (skipDots && fill.kind === 'dot') continue;
    if (pointInPolygon(p, fill.points)) tone += fill.tone;
  }
  for (const r of motif.tones) if (pointInPolygon(p, r.points)) tone += r.tone;
  return Math.min(1, tone);
}

function blankGrid(): string[][] {
  return Array.from({ length: GRID_ROWS }, () => Array<string>(GRID_COLS).fill(' '));
}

function toRows(grid: string[][]): string[] {
  return grid.map((row) => row.join(''));
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const clampIndex = (x: number, size: number) => clamp(x, 0, size - 1);
const cellCenter = (r: number, c: number): Pt => ({ x: (c + 0.5) * CELL_W, y: (r + 0.5) * CELL_H });

// Returns the glyph for every cell an edge passes through ('' elsewhere).
// Axis-aligned edges record which neighbors they connect to, so corners and
// junctions come out as proper box corners and tees. Other edges get a glyph
// for their direction: near-flat ones use ¯ ─ _ by where the line sits in the
// cell, which smooths their stair-steps; steeper ones use ╱ ╲ where the line
// crosses into the next column or row, and │ where it doesn't.
function lineGlyphs(motif: Motif, solidKinds: readonly FillKind[]): string[][] {
  const cells = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ links: '', glyph: '', dist: Infinity })),
  );
  const inGrid = (r: number, c: number) => r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS;
  const link = (r: number, c: number, side: string) => {
    if (inGrid(r, c) && !cells[r][c].links.includes(side)) cells[r][c].links += side;
  };
  const mark = (r: number, c: number, glyph: string, a: Pt, b: Pt) => {
    if (!inGrid(r, c)) return;
    const cell = cells[r][c];
    const dist = distToSegment({ x: c + 0.5, y: r + 0.5 }, a, b);
    if (dist < cell.dist) {
      cell.glyph = glyph;
      cell.dist = dist;
    }
  };
  const levelGlyph = (v: number) => {
    const f = v - Math.floor(v);
    return f < 0.34 ? '¯' : f > 0.66 ? '_' : '─';
  };

  const drawSegment = (from: Pt, to: Pt) => {
    const a = { x: from.x / CELL_W, y: from.y / CELL_H };
    const b = { x: to.x / CELL_W, y: to.y / CELL_H };

    if (Math.abs(from.y - to.y) < 1e-9) {
      const r = clampIndex(Math.floor(a.y), GRID_ROWS);
      const c0 = clampIndex(Math.floor(Math.min(a.x, b.x)), GRID_COLS);
      const c1 = clampIndex(Math.floor(Math.max(a.x, b.x)), GRID_COLS);
      for (let c = c0; c <= c1; c++) {
        if (c > c0 || c0 === c1) link(r, c, 'L');
        if (c < c1 || c0 === c1) link(r, c, 'R');
      }
      return;
    }
    if (Math.abs(from.x - to.x) < 1e-9) {
      const c = clampIndex(Math.floor(a.x), GRID_COLS);
      const r0 = clampIndex(Math.floor(Math.min(a.y, b.y)), GRID_ROWS);
      const r1 = clampIndex(Math.floor(Math.max(a.y, b.y)), GRID_ROWS);
      for (let r = r0; r <= r1; r++) {
        if (r > r0 || r0 === r1) link(r, c, 'U');
        if (r < r1 || r0 === r1) link(r, c, 'D');
      }
      return;
    }

    const du = b.x - a.x;
    const dv = b.y - a.y;
    const slope = Math.abs(dv / du);
    const diagonal = du * dv > 0 ? '╲' : '╱';
    const vAt = (u: number) => a.y + ((u - a.x) * dv) / du;
    const uAt = (v: number) => a.x + ((v - a.y) * du) / dv;
    const u0 = Math.min(a.x, b.x);
    const u1 = Math.max(a.x, b.x);
    const v0 = Math.min(a.y, b.y);
    const v1 = Math.max(a.y, b.y);

    if (slope <= 1) {
      for (let c = Math.floor(u0); c <= Math.floor(u1); c++) {
        const v = vAt(clamp(c + 0.5, u0, u1));
        const crossesRow = Math.floor(vAt(clamp(c, u0, u1))) !== Math.floor(vAt(clamp(c + 1, u0, u1)));
        mark(Math.floor(v), c, slope >= 0.45 && crossesRow ? diagonal : levelGlyph(v), a, b);
      }
    } else {
      for (let r = Math.floor(v0); r <= Math.floor(v1); r++) {
        const u = uAt(clamp(r + 0.5, v0, v1));
        const crossesCol = Math.floor(uAt(clamp(r, v0, v1))) !== Math.floor(uAt(clamp(r + 1, v0, v1)));
        mark(r, Math.floor(u), crossesCol ? diagonal : '│', a, b);
      }
    }
  };

  const lines = [...motif.strokes, ...motif.fills.filter((f) => f.kind === 'outline').map((f) => closeLoop(f.points))];
  for (const line of lines) for (let i = 0; i < line.length - 1; i++) drawSegment(line[i], line[i + 1]);

  for (const row of cells) {
    for (const cell of row) {
      if (!cell.links) continue;
      const key = ['L', 'R', 'U', 'D'].filter((side) => cell.links.includes(side)).join('');
      // A lone link is just the end of a straight edge; if a sloped edge also
      // passes through this cell, its glyph describes the corner better.
      if (!(key.length === 1 && cell.glyph)) cell.glyph = BOX_GLYPHS[key];
    }
  }

  for (const fill of motif.fills) {
    if (!solidKinds.includes(fill.kind)) continue;
    const hits: [number, number][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (pointInPolygon(cellCenter(r, c), fill.points)) hits.push([r, c]);
      }
    }
    if (fill.kind === 'dot' && hits.length <= 12) {
      const cx = fill.points.reduce((sum, p) => sum + p.x, 0) / fill.points.length;
      const cy = fill.points.reduce((sum, p) => sum + p.y, 0) / fill.points.length;
      cells[clampIndex(Math.floor(cy / CELL_H), GRID_ROWS)][clampIndex(Math.floor(cx / CELL_W), GRID_COLS)].glyph = '•';
    } else {
      for (const [r, c] of hits) cells[r][c].glyph = '•';
    }
  }

  return cells.map((row) => row.map((cell) => cell.glyph));
}

function boxCells(at: Box) {
  return {
    r0: clampIndex(Math.floor(at.y / CELL_H) - 1, GRID_ROWS),
    r1: clampIndex(Math.ceil((at.y + at.size) / CELL_H), GRID_ROWS),
    c0: clampIndex(Math.floor(at.x / CELL_W) - 1, GRID_COLS),
    c1: clampIndex(Math.ceil((at.x + at.size) / CELL_W), GRID_COLS),
  };
}

function renderShading(motif: Motif, at: Box, grid: string[][]) {
  const samples = 4;
  const strokeHalfWidth = 0.42 * CELL_H;
  const strokeTone = motif.strokeTone ?? 1;
  const { r0, r1, c0, c1 } = boxCells(at);

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      let coverage = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const p = { x: (c + (sx + 0.5) / samples) * CELL_W, y: (r + (sy + 0.5) / samples) * CELL_H };
          let value = regionTone(p, motif, false);
          if (value < strokeTone && motif.strokes.some((line) => distToPolyline(p, line) < strokeHalfWidth)) {
            value = strokeTone;
          }
          coverage += value;
        }
      }
      const level = Math.round((coverage / (samples * samples)) * (SHADE_RAMP.length - 1));
      const glyph = SHADE_RAMP[Math.min(SHADE_RAMP.length - 1, level)];
      if (glyph !== ' ') grid[r][c] = glyph;
    }
  }
}

function renderScene(placed: { motif: Motif; at: Box }[], text: string, primary: Box): HgLayer[] {
  const hybrid = placed.filter((p) => p.motif.technique !== 'shading');
  const merged: Motif = {
    fills: hybrid.flatMap((p) => p.motif.fills),
    strokes: hybrid.flatMap((p) => p.motif.strokes),
    tones: hybrid.flatMap((p) => p.motif.tones),
  };

  const shade = blankGrid();
  for (const p of placed) if (p.motif.technique === 'shading') renderShading(p.motif, p.at, shade);

  const glyphs = lineGlyphs(merged, ['dot']);
  const lines = blankGrid();
  const words = [blankGrid(), blankGrid(), blankGrid()];
  const bands = hybrid
    .filter((p) => p.motif.wordBand)
    .map((p) => ({
      band: p.motif.wordBand as number,
      strokes: p.motif.strokes.map((line) => line.map((pt) => ({ x: pt.x / CELL_W, y: pt.y / CELL_H }))),
    }));
  const isLine = (r: number, c: number) => c >= 0 && c < GRID_COLS && glyphs[r][c] !== '';
  let index = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (shade[r][c] !== ' ') continue;
      if (isLine(r, c)) {
        lines[r][c] = glyphs[r][c];
        continue;
      }
      // A one-cell gutter either side of every line keeps it from being lost
      // among the letters.
      if (isLine(r, c - 1) || isLine(r, c + 1)) continue;

      let tone = regionTone(cellCenter(r, c), merged, true);
      if (
        tone < 0.03 &&
        bands.some(({ band, strokes }) => strokes.some((line) => distToPolyline({ x: c + 0.5, y: r + 0.5 }, line) < band))
      ) {
        tone = 0.5;
      }
      if (tone < 0.03) continue;

      // Only visible cells consume a character, so more of the article's real
      // words land inside the shapes; a space becomes a middle dot rather than
      // punching a hole in them.
      const char = text[index % text.length];
      index += 1;
      words[tone < 0.3 ? 0 : tone < 0.62 ? 1 : 2][r][c] = /\s/.test(char) ? '·' : char;
    }
  }

  // Graph-paper dots and crosses behind everything, plus crop marks at the
  // primary motif's corners, for a faint technical-drawing texture.
  const detail = blankGrid();
  const occupied = (r: number, c: number) =>
    c < 0 ||
    c >= GRID_COLS ||
    shade[r][c] !== ' ' ||
    lines[r][c] !== ' ' ||
    words.some((w) => w[r][c] !== ' ');
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (occupied(r, c) || isLine(r, c - 1) || isLine(r, c + 1)) continue;
      if (c % 24 === 12 && r % 12 === 6) detail[r][c] = '+';
      else if (c % 6 === 0 && r % 3 === 0) detail[r][c] = '·';
    }
  }
  const { r0, r1, c0, c1 } = boxCells(primary);
  const crop: [number, number, string][] = [
    [r0, c0, '┌'], [r0, c0 + 1, '─'], [r0 + 1, c0, '│'],
    [r0, c1, '┐'], [r0, c1 - 1, '─'], [r0 + 1, c1, '│'],
    [r1, c0, '└'], [r1, c0 + 1, '─'], [r1 - 1, c0, '│'],
    [r1, c1, '┘'], [r1, c1 - 1, '─'], [r1 - 1, c1, '│'],
  ];
  for (const [r, c, glyph] of crop) if (!occupied(r, c)) detail[r][c] = glyph;

  return [
    { kind: 'detail', rows: toRows(detail) },
    { kind: 'words-light', rows: toRows(words[0]) },
    { kind: 'words-mid', rows: toRows(words[1]) },
    { kind: 'words-strong', rows: toRows(words[2]) },
    { kind: 'shade', rows: toRows(shade) },
    { kind: 'line', rows: toRows(lines) },
  ];
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// mulberry32: small, fast, deterministic PRNG seeded from the hash above.
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

/** Strips Markdown/MDX syntax down to plain prose, to fill the grid with. */
function cleanArticleText(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---/, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The art's wash colors, without the cost of building the whole composition. */
export function artGradientVariant(slug: string): GradientVariant {
  const random = createRandom(hashString(slug));
  return GRADIENT_VARIANTS[Math.floor(random() * GRADIENT_VARIANTS.length)];
}

export function buildHypergraphicArt(
  slug: string,
  disciplines: readonly Discipline[],
  articleBody: string,
  art?: ArticleArt,
): HypergraphicArt {
  const random = createRandom(hashString(slug));
  const gradientVariant = GRADIENT_VARIANTS[Math.floor(random() * GRADIENT_VARIANTS.length)];
  const layout = LAYOUTS[Math.floor(random() * LAYOUTS.length)];
  const primaryKey = art?.primary ?? DISCIPLINE_DEFAULTS[disciplines[0]] ?? 'seal';
  const secondaryKey = art?.secondary;

  const primaryBox = secondaryKey ? layout.primary : SOLO_LAYOUT;
  const placed = [{ motif: place(MOTIFS[primaryKey], primaryBox), at: primaryBox }];
  if (secondaryKey) placed.push({ motif: place(MOTIFS[secondaryKey], layout.secondary), at: layout.secondary });

  const layers = renderScene(placed, cleanArticleText(articleBody) || 'the only', primaryBox);
  return { gradientVariant, layers };
}
