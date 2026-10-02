// "Hypergraphy" article art: one motif chosen for the article's subject
// (its frontmatter `art` field), unique to that article, deterministically
// generated from the slug so the same article always renders the same art.
//
// It's drawn like a typographic portrait: the article's own text runs in
// rows across the whole grid, and each cell's darkness decides whether its
// letter shows. Dark areas read as solid words, mid-tones as short
// fragments, and highlights as empty space, with no outlines anywhere, so
// edges fade into the background instead of stair-stepping.
//
// To add a motif: author it in MOTIFS below in a 0-100 square, add its key
// to ART_MOTIFS, and preview it with
// `node --experimental-strip-types --no-warnings scripts/preview-art.mjs <key>`.

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
  'bag',
  'blend',
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
  'sphere',
  'swatches',
  'timeline',
  'tokens',
  'wand',
  'waveform',
  'wheel',
] as const;
export type ArtMotif = (typeof ART_MOTIFS)[number];

interface Pt {
  x: number;
  y: number;
}

interface Box {
  x: number;
  y: number;
  size: number;
}

// How a fill is drawn: a soft round mark, a shaded area, or a shaded area
// with a darker edge line around it.
type FillKind = 'dot' | 'solid' | 'outline';

// Motifs are authored in a 0-100 unit square. `tone` (0-1) is how dark an
// area reads, which sets how densely the text shows inside it; overlapping
// tones add. Strokes are lines, darkest at their core.
interface Motif {
  fills: { points: Pt[]; kind: FillKind; tone: number }[];
  strokes: Pt[][];
  tones: { points: Pt[]; tone: number }[];
  strokeTone?: number;
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

function ellipse(cx: number, cy: number, rx: number, ry: number, segments = 36): Pt[] {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
}

// A shape partway between a circle (t = 0) and a square (t = 1), for the
// blend motif. Each circle point is pushed out toward the square's edge
// along the same angle.
function circleToSquare(cx: number, cy: number, r: number, t: number, segments = 36): Pt[] {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const scale = 1 + t * (1 / Math.max(Math.abs(cos), Math.abs(sin)) - 1);
    return { x: cx + cos * r * scale, y: cy + sin * r * scale };
  });
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

// A front-facing head: an oval, slightly narrower toward the chin.
const FACE_HEAD = poly([
  50, 12, 63, 15, 72, 25, 75, 40, 73, 55, 67, 67, 58, 75, 50, 77, 42, 75, 33, 67, 27, 55, 25, 40, 28, 25, 37, 15, 50, 12,
]);
// Hair sitting on top of the head. The fringe stays high so there's a clear
// forehead gap above the brows; lower, and the brows merge into the hair.
const FACE_HAIR = poly([
  24, 44, 23, 28, 30, 15, 42, 8, 56, 8, 68, 13, 76, 25, 77, 44, 73, 30, 64, 21, 50, 19, 38, 21, 30, 27, 24, 44,
]);
const CAMERA_BODY = poly([8, 30, 30, 30, 36, 20, 58, 20, 64, 30, 92, 30, 92, 82, 8, 82, 8, 30]);
const PAGE = poly([18, 6, 66, 6, 84, 24, 84, 94, 18, 94]);
const CLOUD = poly([
  14, 72, 8, 62, 10, 52, 20, 46, 26, 46, 28, 36, 36, 28, 48, 24, 60, 28, 68, 36, 72, 42, 80, 40, 88, 44, 94, 54, 92, 64,
  84, 72,
]);
// Nine bars, ten units apart: closer than that and the soft edges of
// neighboring bars merge into one blob at secondary-motif size.
const WAVE_HEIGHTS = [14, 30, 20, 42, 26, 38, 18, 32, 12];
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
  // A shopping bag: a tapered body, a looped handle, and two rivets where
  // the handle meets the bag. Online stores and commerce.
  bag: {
    fills: [outline(poly([20, 38, 80, 38, 88, 92, 12, 92]), 0.35), dot(36, 50), dot(64, 50)],
    strokes: [cubic({ x: 36, y: 50 }, { x: 34, y: 8 }, { x: 66, y: 8 }, { x: 64, y: 50 })],
    tones: [],
  },
  // A blend between two shapes: a circle stepping into a square, a little
  // darker at each step, like Affinity's Blend Tool. The steps must not
  // touch, or they merge into one block.
  blend: {
    fills: [0, 1 / 3, 2 / 3, 1].map((t, i) => outline(circleToSquare(14 + i * 24, 50, 10, t), 0.25 + 0.2 * i)),
    strokes: [],
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
  },
  // A page with a folded corner and a headline block.
  document: {
    fills: [],
    strokes: [closeLoop(PAGE), poly([66, 6, 66, 24, 84, 24])],
    tones: [region(PAGE, 0.18), region(box(26, 32, 62, 40), 0.6)],
  },
  // A front-facing face: hair, eyes, brows, nose, lips, ears, and a neck
  // into shoulders.
  face: {
    fills: [
      outline(FACE_HAIR, 0.45),
      // Eyes, brows, and lips as filled shapes so they hold up at banner
      // size, where single lines inside the pale face drop out. Brows sit
      // well above the eyes: closer, and the two merge into one dark
      // socket-like block.
      outline(ellipse(39, 48, 6.5, 2.4), 1),
      outline(ellipse(61, 48, 6.5, 2.4), 1),
      outline(poly([31, 36, 38, 33, 46, 34, 46, 36.5, 38, 35.5, 31, 38]), 0.85),
      outline(poly([69, 36, 62, 33, 54, 34, 54, 36.5, 62, 35.5, 69, 38]), 0.85),
      outline(
        [
          ...cubic({ x: 41, y: 66 }, { x: 46, y: 64.5 }, { x: 54, y: 64.5 }, { x: 59, y: 66 }, 12),
          ...cubic({ x: 59, y: 66 }, { x: 55, y: 71 }, { x: 45, y: 71 }, { x: 41, y: 66 }, 12),
        ],
        0.8,
      ),
    ],
    strokes: [
      FACE_HEAD,
      // Nose.
      poly([51, 49, 48, 58, 52, 59]),
      // Ears.
      poly([25, 44, 21, 46, 21, 53, 26, 56]),
      poly([75, 44, 79, 46, 79, 53, 74, 56]),
      // Neck into shoulders.
      poly([43, 75, 43, 84, 16, 92, 10, 100]),
      poly([57, 75, 57, 84, 84, 92, 90, 100]),
    ],
    // No tone inside the head: the face stays blank like a highlight, so
    // only the hair, outline, and features carry text.
    tones: [region(poly([10, 100, 16, 92, 43, 84, 57, 84, 84, 92, 90, 100]), 0.3)],
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
  // A shaded sphere over its shadow, with an equator and a meridian: 3D
  // surfaces and textures.
  sphere: {
    fills: [],
    strokes: [closeLoop(ellipse(50, 46, 36, 9)), closeLoop(ellipse(50, 46, 13, 36))],
    tones: [
      region(circle(50, 46, 36), 0.3),
      region(circle(58, 54, 28), 0.3),
      region(circle(64, 60, 18), 0.3),
      region(ellipse(52, 90, 30, 5), 0.5),
    ],
    strokeTone: 0.7,
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
  // A design-token table: header labels over a rule, then rows of a color
  // chip, a token name, and its value.
  tokens: {
    fills: [0.35, 0.55, 0.75, 0.95].map((tone, i) => ({
      points: box(10, 20 + i * 20, 22, 30 + i * 20),
      kind: 'solid' as const,
      tone,
    })),
    strokes: [
      poly([10, 6, 30, 6]),
      poly([70, 6, 84, 6]),
      poly([10, 12, 90, 12]),
      ...[58, 50, 56, 46].map((end, i) => poly([30, 25 + i * 20, end, 25 + i * 20])),
      ...[88, 82, 86, 80].map((end, i) => poly([70, 25 + i * 20, end, 25 + i * 20])),
    ],
    tones: [],
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
    strokes: WAVE_HEIGHTS.map((h, i) => poly([10 + i * 10, 50 - h, 10 + i * 10, 50 + h])),
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


const CANVAS_W = 800;
const CANVAS_H = 420;
// Cells keep a monospace character's proportions (3.9 x 7 canvas units). Rows
// are what limit how smoothly a curve can step, so there are plenty of them.
export const GRID_COLS = 206;
export const GRID_ROWS = 60;
const CELL_W = CANVAS_W / GRID_COLS;
const CELL_H = CANVAS_H / GRID_ROWS;

export const HYPERGRAPHY_CANVAS = { width: CANVAS_W, height: CANVAS_H, cellW: CELL_W, cellH: CELL_H };

// How large a motif's 0-100 square is drawn on the canvas.
const MOTIF_SIZE = 380;
// Breathing room between the drawing and its crop marks, in canvas units.
const CROP_PADDING = 18;

// Each cell's darkness is averaged over SAMPLES x SAMPLES points, so curves
// and diagonals come out smooth at any angle instead of stair-stepping.
const SAMPLES = 2;
// Lines are fully dark within STROKE_CORE canvas units of their path, then
// fade to nothing over STROKE_SOFT, so they dissolve into the background.
const STROKE_CORE = 2.8;
const STROKE_SOFT = 5;
// A region's darkness ramps up over this distance in from its edge.
const EDGE_FADE = 16;
// Text shows in runs whose length follows darkness, repeating every
// RUN_PERIOD cells, like typographic halftone. Each row's runs start at a
// pseudo-random offset; a regular stagger lines them up into diagonal
// stripes.
const RUN_PERIOD = 8;
function rowOffset(r: number): number {
  let h = Math.imul(r ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) % RUN_PERIOD;
}

export type HgLayerKind = 'detail' | 'words-light' | 'words-mid' | 'words-strong';

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

function blankGrid(): string[][] {
  return Array.from({ length: GRID_ROWS }, () => Array<string>(GRID_COLS).fill(' '));
}

function toRows(grid: string[][]): string[] {
  return grid.map((row) => row.join(''));
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const clampIndex = (x: number, size: number) => clamp(x, 0, size - 1);

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function centroid(points: Pt[]): Pt {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
}

// Darkness (0-1) at one point of a placed motif, kept as two parts. Areas
// get their tone, lit from the top left so they have highlights and shadows,
// and fade in from their edges; marks (lines and dots) are dark at their
// core and fade out.
function darknessAt(p: Pt, motif: Motif, at: Box): { area: number; mark: number } {
  const light = 0.7 + (0.6 * (p.x - at.x + (p.y - at.y))) / (2 * at.size);
  let area = 0;
  for (const shape of [...motif.fills.filter((f) => f.kind !== 'dot'), ...motif.tones]) {
    if (!pointInPolygon(p, shape.points)) continue;
    area += shape.tone * (0.3 + 0.7 * smoothstep(0, EDGE_FADE, distToPolyline(p, closeLoop(shape.points))));
  }

  const reach = STROKE_CORE + STROKE_SOFT;
  const strokeTone = motif.strokeTone ?? 1;
  const lines = [...motif.strokes, ...motif.fills.filter((f) => f.kind === 'outline').map((f) => closeLoop(f.points))];
  let mark = 0;
  for (const line of lines) {
    const d = distToPolyline(p, line);
    if (d < reach) mark = Math.max(mark, strokeTone * (1 - smoothstep(STROKE_CORE, reach, d)));
  }
  for (const fill of motif.fills) {
    if (fill.kind !== 'dot') continue;
    const center = centroid(fill.points);
    const radius = Math.hypot(fill.points[0].x - center.x, fill.points[0].y - center.y);
    const d = Math.hypot(p.x - center.x, p.y - center.y);
    mark = Math.max(mark, 1 - smoothstep(radius, radius + STROKE_SOFT, d));
  }

  return { area: Math.min(1, area * light), mark };
}

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// The extent of everything a motif draws, in whatever space its points are in.
function motifBounds(motif: Motif): Rect {
  const points = [...motif.fills.flatMap((f) => f.points), ...motif.strokes.flat(), ...motif.tones.flatMap((t) => t.points)];
  return {
    x0: Math.min(...points.map((p) => p.x)),
    y0: Math.min(...points.map((p) => p.y)),
    x1: Math.max(...points.map((p) => p.x)),
    y1: Math.max(...points.map((p) => p.y)),
  };
}

function rectCells(rect: Rect) {
  return {
    r0: clampIndex(Math.floor(rect.y0 / CELL_H), GRID_ROWS),
    r1: clampIndex(Math.ceil(rect.y1 / CELL_H), GRID_ROWS),
    c0: clampIndex(Math.floor(rect.x0 / CELL_W), GRID_COLS),
    c1: clampIndex(Math.ceil(rect.x1 / CELL_W), GRID_COLS),
  };
}

// Within each run period a cell's threshold rises from the middle outward,
// so darker areas show longer runs of text and lighter ones short
// fragments: spacing, not outlines, does the shading.
function runThreshold(r: number, c: number): number {
  const u = (((c + rowOffset(r)) % RUN_PERIOD) + 0.5) / RUN_PERIOD;
  return Math.abs(2 * u - 1);
}

function renderScene(motif: Motif, at: Box, text: string): HgLayer[] {
  const darkness = Array.from({ length: GRID_ROWS }, () => new Float32Array(GRID_COLS));
  const drawn = motifBounds(motif);
  const reach = STROKE_CORE + STROKE_SOFT + CELL_H;
  const bounds = rectCells({ x0: drawn.x0 - reach, y0: drawn.y0 - reach, x1: drawn.x1 + reach, y1: drawn.y1 + reach });
  for (let r = bounds.r0; r <= bounds.r1; r++) {
    for (let c = bounds.c0; c <= bounds.c1; c++) {
      // Areas are averaged across the cell so their edges fade smoothly.
      // Marks take the cell's darkest point, curved upward, so thin lines
      // stay solid instead of averaging away into a scatter. That contrast
      // between solid lines and sparse areas keeps the shapes legible.
      let area = 0;
      let mark = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const p = { x: (c + (sx + 0.5) / SAMPLES) * CELL_W, y: (r + (sy + 0.5) / SAMPLES) * CELL_H };
          const d = darknessAt(p, motif, at);
          area += d.area;
          mark = Math.max(mark, d.mark);
        }
      }
      // Pale areas drop to nothing so highlights are blank paper, as in a
      // typographic portrait; mid and dark areas keep their halftone.
      const shaded = smoothstep(0.1, 0.9, (1.8 * area) / (SAMPLES * SAMPLES));
      darkness[r][c] = Math.max(shaded, 1 - (1 - mark) ** 2);
    }
  }

  // The article's text runs continuously across the whole grid and darkness
  // decides which stretches show, so dark areas read as whole words and
  // light ones as fragments. A space becomes a middle dot so it doesn't
  // punch a hole in a dark run.
  const words = [blankGrid(), blankGrid(), blankGrid()];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const d = darkness[r][c];
      if (d <= runThreshold(r, c)) continue;
      const char = text[(r * GRID_COLS + c) % text.length];
      words[d < 0.4 ? 0 : d < 0.75 ? 1 : 2][r][c] = /\s/.test(char) ? '·' : char;
    }
  }

  // Faint registration crosses, plus crop marks at the motif's corners, for
  // a quiet technical-drawing texture around the art.
  const detail = blankGrid();
  const occupied = (r: number, c: number) => words.some((w) => w[r][c] !== ' ');
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (c % 24 === 12 && r % 12 === 6 && !occupied(r, c)) detail[r][c] = '+';
    }
  }
  const { r0, r1, c0, c1 } = rectCells({
    x0: drawn.x0 - CROP_PADDING,
    y0: drawn.y0 - CROP_PADDING,
    x1: drawn.x1 + CROP_PADDING,
    y1: drawn.y1 + CROP_PADDING,
  });
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

export function buildHypergraphicArt(slug: string, articleBody: string, motif: ArtMotif): HypergraphicArt {
  const random = createRandom(hashString(slug));
  const gradientVariant = GRADIENT_VARIANTS[Math.floor(random() * GRADIENT_VARIANTS.length)];
  // Centers what the motif actually draws, not its 0-100 square, since many
  // motifs don't fill their square evenly (the blend is a short, wide strip).
  const drawn = motifBounds(MOTIFS[motif]);
  const scale = MOTIF_SIZE / 100;
  const at: Box = {
    x: CANVAS_W / 2 - ((drawn.x0 + drawn.x1) / 2) * scale,
    y: CANVAS_H / 2 - ((drawn.y0 + drawn.y1) / 2) * scale,
    size: MOTIF_SIZE,
  };
  const layers = renderScene(place(MOTIFS[motif], at), at, cleanArticleText(articleBody) || 'the only');
  return { gradientVariant, layers };
}
