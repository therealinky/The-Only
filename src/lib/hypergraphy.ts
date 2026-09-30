// "Hypergraphy" article hero art — an ASCII-art-style rendering of a simple
// discipline motif, filled with characters pulled from the article's own
// text (a nod to microscript/word-portrait art without reproducing any
// specific existing artwork). Deterministically generated from the
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

interface Pt {
  x: number;
  y: number;
}

type MotifKey = 'face' | 'chart' | 'reel' | 'browser' | 'seal' | 'ribbon' | 'cube';

// Every motif is authored as plain polygons/polylines in a 0-100 unit box
// (not SVG path strings): `fill` shapes are closed and get filled solid,
// `stroke` shapes are open and get a thick "ink band" along their length.
// Point-in-polygon and distance-to-polyline tests below turn these into an
// ASCII-art ink mask. Slight faceting versus the old bezier curves is
// invisible at character-grid resolution.
const MOTIFS: Record<MotifKey, { fill: Pt[][]; stroke: Pt[][] }> = {
  // UI/UX — a face profile OUTLINE (forehead, nose, lips, chin) plus a
  // small filled pupil and an ear mark. Used to be a solid-filled
  // silhouette, which reads more like a blob than a face at a glance, a
  // hollow outline (just the profile line itself, only the small eye dot
  // filled) is what actually shows the nose/lips/chin zigzag as a
  // recognizable line instead of burying it inside a solid shape.
  face: {
    fill: [circle(40, 22, 2.6)],
    stroke: [
      poly([
        26, 6, 40, 6, 50, 12, 53, 20, 51, 26, 67, 34, 57, 38, 61, 44, 55, 48, 58, 56, 47, 62, 41, 66, 33, 80, 18, 78,
        8, 58, 6, 30, 12, 14, 26, 6,
      ]),
      poly([16, 50, 13, 53, 13, 58, 16, 61]),
    ],
  },
  // Creative Coding — a bar chart with a trend line over the top, on axes,
  // the axis lines are what make it read as "a chart" instead of "some
  // floating rectangles."
  chart: {
    fill: [
      rect(16, 63, 85, 7),
      rect(35, 48, 85, 7),
      rect(54, 33, 85, 7),
      rect(73, 52, 85, 7),
      rect(92, 20, 85, 7),
    ],
    stroke: [
      poly([14, 58, 28, 46, 40, 50, 52, 30, 62, 15, 78, 34, 94, 16]),
      poly([8, 8, 8, 88, 96, 88]),
    ],
  },
  // Motion & Video — a frame OUTLINE (not a solid block, see the note on
  // `browser` below), a small filled play triangle, and film-tick marks on
  // both edges (a filmstrip's sprocket holes, not just a decoration on one
  // side).
  reel: {
    fill: [poly([40, 33, 40, 67, 68, 50])],
    stroke: [
      rectOutline(14, 20, 86, 72),
      poly([9, 26, 9, 34]), poly([9, 46, 9, 54]), poly([9, 66, 9, 74]),
      poly([91, 26, 91, 34]), poly([91, 46, 91, 54]), poly([91, 66, 91, 74]),
    ],
  },
  // Web — a browser frame OUTLINE, traffic-light dots, an address-bar
  // divider, and a wandering content line. The frame used to be a *solid
  // filled* 86x70 rectangle, nearly the entire shape's canvas. A fill
  // region is entirely ink, so the stroke lines and dots drawn "inside" it
  // were redundant, already-ink cells, invisible against the solid block.
  // This is likely the single biggest source of "it just looks like a
  // rectangle": for Web articles, the motif genuinely was one. An outline
  // frame with a hollow, mostly-blank interior is what actually reads as
  // "a window" instead of "a filled box."
  browser: {
    fill: [circle(22, 24, 2.4), circle(30, 24, 2.4), circle(38, 24, 2.4)],
    stroke: [
      rectOutline(10, 15, 96, 85),
      poly([10, 33, 96, 33]),
      poly([18, 60, 28, 44, 38, 76, 48, 58, 58, 42, 68, 70, 82, 50]),
    ],
  },
  // Brand — two clearly separate, only lightly overlapping circles (a real
  // Venn-style seal mark), plus a diagonal mark through them. The old
  // version had the centers closer together than the sum of the radii by a
  // wide margin, so the two circles fully merged into one plain oval with
  // no waist between them, this is the actual bug that made "Brand" read
  // as a blob rather than a seal.
  seal: {
    fill: [circle(28, 50, 23), circle(72, 50, 23)],
    stroke: [poly([30, 24, 70, 76])],
  },
  // Illustration — a single flowing brush stroke with an ink-blot accent.
  ribbon: {
    fill: [circle(93, 22, 3.4)],
    stroke: [poly([8, 72, 24, 18, 46, 92, 60, 38, 70, 4, 84, 52, 93, 26])],
  },
  // 3D — an isometric wireframe cube: a hexagon outline plus a Y from the
  // center to alternating vertices, the classic way to draw a cube in line
  // art. This used to fill the three faces solid instead: fill is a pure
  // boolean "ink here" test with no concept of which face, so a stroke
  // drawn over an already-filled region is invisible, same cells, still
  // ink either way. That merged the three faces into one solid hexagon
  // blob with no internal lines at all. No fill at all here, the hexagon
  // and the Y are both strokes, so the interior stays hollow and the
  // dividing lines are the only ink there.
  cube: {
    fill: [],
    stroke: [
      poly([50, 15, 80, 32, 80, 68, 50, 85, 20, 68, 20, 32, 50, 15]),
      poly([50, 49, 80, 32]),
      poly([50, 49, 20, 32]),
      poly([50, 49, 50, 85]),
    ],
  },
};

function poly(flat: number[]): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] });
  return points;
}

function rect(cx: number, y1: number, y2: number, w: number): Pt[] {
  const half = w / 2;
  return poly([cx - half, y1, cx - half, y2, cx + half, y2, cx + half, y1]);
}

// A closed rectangle outline as a stroke polyline: closes back to the
// start point so distToPolyline sees a complete outline (four segments),
// not a fillable region.
function rectOutline(x1: number, y1: number, x2: number, y2: number): Pt[] {
  return poly([x1, y1, x2, y1, x2, y2, x1, y2, x1, y1]);
}

function circle(cx: number, cy: number, r: number, segments = 14): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return points;
}

function pointInPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const { x: xi, y: yi } = poly[i];
    const { x: xj, y: yj } = poly[j];
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

const DISCIPLINE_MOTIFS: Record<Discipline, MotifKey> = {
  Brand: 'seal',
  Web: 'browser',
  'UI/UX': 'face',
  'Motion & Video': 'reel',
  Illustration: 'ribbon',
  '3D': 'cube',
  'Creative Coding': 'chart',
};

// 30x16 (480 cells) was nowhere near enough resolution to trace an actual
// curve or feature, every motif just came out as a rounded blob no matter
// how the shape itself was authored. 46x26 (1196 cells, ~2.5x) is enough to
// show real silhouette detail (a face's profile zigzag, a cube's internal
// edges) while each character is still large enough to read as a character.
export const GRID_COLS = 46;
export const GRID_ROWS = 26;
// Scaled down from the old grid's 3.4 to roughly preserve stroke thickness
// relative to the now-smaller cell pitch, a fixed radius over more, smaller
// cells would otherwise render strokes visibly thicker than before.
const STROKE_INK_RADIUS = 2.2;

export interface HypergraphicArt {
  gradientVariant: GradientVariant;
  rows: string[];
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

/** Strips Markdown/MDX syntax down to plain prose, to fill the grid with. */
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

function buildInkGrid(motif: { fill: Pt[][]; stroke: Pt[][] }): boolean[][] {
  const grid: boolean[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const y = (row + 0.5) * (100 / GRID_ROWS);
    const rowInk: boolean[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      const x = (col + 0.5) * (100 / GRID_COLS);
      const p = { x, y };
      const ink =
        motif.fill.some((region) => pointInPolygon(p, region)) ||
        motif.stroke.some((line) => distToPolyline(p, line) < STROKE_INK_RADIUS);
      rowInk.push(ink);
    }
    grid.push(rowInk);
  }
  return grid;
}

// Only consumes a source character for cells that are actually visible, so
// more of the article's real words show up inside the shape instead of
// being spent on cells that render blank anyway. A source space landing on
// an ink cell becomes a middle dot rather than a literal gap, so word
// breaks don't punch holes in the silhouette.
function buildRows(grid: boolean[][], text: string): string[] {
  const source = text.length > 0 ? text : 'the only';
  let index = 0;
  return grid.map((rowInk) =>
    rowInk
      .map((ink) => {
        if (!ink) return ' ';
        const char = source[index % source.length];
        index += 1;
        return /\s/.test(char) ? '·' : char;
      })
      .join(''),
  );
}

export function buildHypergraphicArt(slug: string, disciplines: readonly Discipline[], articleBody: string): HypergraphicArt {
  const random = createRandom(hashString(slug));
  const motifKey = DISCIPLINE_MOTIFS[disciplines[0]] ?? 'seal';
  const grid = buildInkGrid(MOTIFS[motifKey]);
  const rows = buildRows(grid, cleanArticleText(articleBody));
  const gradientVariant = GRADIENT_VARIANTS[Math.floor(random() * GRADIENT_VARIANTS.length)];
  return { gradientVariant, rows };
}

const CANVAS_W = 800;
// Taller than the old 800x300: a wide, short banner left the motif's own
// square footprint (always min(motifBox.w, motifBox.h), see below) small
// and centered in a lot of empty horizontal space, which read as "a
// rectangle with a text pattern in it" rather than a shape. More height
// gives the square room to actually grow.
const CANVAS_H = 420;
// The rendered motif is always a square (100x100 units scaled uniformly)
// centered inside this box at size min(w, h), so keeping w === h here
// means none of this box's area goes to wasted margin, the whole thing
// becomes the shape.
const MOTIF_BOX = { x: 230, y: 40, w: 340, h: 340 };

export const HYPERGRAPHY_CANVAS = { width: CANVAS_W, height: CANVAS_H, motifBox: MOTIF_BOX };
