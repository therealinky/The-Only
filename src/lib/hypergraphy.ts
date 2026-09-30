// "Hypergraphy" article hero art: a discipline motif drawn as a character
// grid, deterministically generated from the article's slug so the same
// article always renders the same art.
//
// Two techniques:
// - hybrid: crisp line-drawing edges (glyphs chosen by edge direction, box
//   corners where lines meet), with the article's own words filling each
//   region at that region's tone.
// - shading: every cell's coverage and region tone picks a glyph by visual
//   weight, so faces read as solid and dimensional. Used for 3D.
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
type Technique = 'hybrid' | 'shading';

// How the hybrid technique draws a fill: a single mark, words packed inside
// it, or its outline with words inside.
type FillKind = 'dot' | 'solid' | 'outline';

// Shapes are authored in a 0-100 unit box. `tone` (0-1) is how dark a region
// reads: it drives the shading ramp directly, and in the hybrid it sets how
// strongly the article's words show inside that region. Overlapping tones add.
interface Motif {
  fills: { points: Pt[]; kind: FillKind; tone: number }[];
  strokes: Pt[][];
  tones: { points: Pt[]; tone: number }[];
  strokeTone?: number;
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

function bar(cx: number, y1: number, y2: number, w: number): Pt[] {
  const half = w / 2;
  return poly([cx - half, y1, cx - half, y2, cx + half, y2, cx + half, y1]);
}

function circle(cx: number, cy: number, r: number, segments = 32): Pt[] {
  return Array.from({ length: segments }, (_, i) => {
    const angle = (i / segments) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
}

function closeLoop(points: Pt[]): Pt[] {
  const first = points[0];
  const last = points[points.length - 1];
  return first.x === last.x && first.y === last.y ? points : [...points, first];
}

const FACE_PROFILE = poly([
  26, 6, 40, 6, 50, 12, 53, 20, 51, 26, 67, 34, 57, 38, 61, 44, 55, 48, 58, 56, 47, 62, 41, 66, 33, 80, 18, 78, 8, 58,
  6, 30, 12, 14, 26, 6,
]);

const MOTIFS: Record<MotifKey, Motif> = {
  // UI/UX: a profile (forehead, nose, lips, chin), an eye, and an ear mark.
  face: {
    fills: [{ points: circle(40, 22, 2.6), kind: 'dot', tone: 1 }],
    strokes: [FACE_PROFILE, poly([16, 50, 13, 53, 13, 58, 16, 61])],
    tones: [{ points: FACE_PROFILE, tone: 0.16 }],
  },
  // Creative Coding: bars on axes with a trend line over the top.
  chart: {
    fills: [bar(16, 63, 85, 7), bar(35, 48, 85, 7), bar(54, 33, 85, 7), bar(73, 52, 85, 7), bar(92, 20, 85, 7)].map(
      (points) => ({ points, kind: 'solid' as const, tone: 0.7 }),
    ),
    strokes: [poly([14, 58, 28, 46, 40, 50, 52, 30, 62, 15, 78, 34, 94, 16]), poly([8, 8, 8, 88, 96, 88])],
    tones: [],
  },
  // Motion & Video: a frame with a play button and sprocket ticks both sides.
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
    tones: [{ points: box(14, 20, 86, 72), tone: 0.12 }],
  },
  // Web: a browser window with traffic-light dots, an address-bar divider,
  // and a wandering content line.
  browser: {
    fills: [22, 30, 38].map((x) => ({ points: circle(x, 24, 2.4), kind: 'dot' as const, tone: 1 })),
    strokes: [
      frame(10, 15, 96, 85),
      poly([10, 33, 96, 33]),
      poly([18, 60, 28, 44, 38, 76, 48, 58, 58, 42, 68, 70, 82, 50]),
    ],
    tones: [
      { points: box(10, 15, 96, 33), tone: 0.42 },
      { points: box(10, 33, 96, 85), tone: 0.1 },
    ],
  },
  // Brand: two overlapping circles and a diagonal mark. The overlap has to be
  // several cells wide, or both arcs and the mark land in one noisy column.
  seal: {
    fills: [
      { points: circle(34, 50, 23), kind: 'outline', tone: 0.4 },
      { points: circle(66, 50, 23), kind: 'outline', tone: 0.6 },
    ],
    strokes: [poly([30, 24, 70, 76])],
    tones: [],
  },
  // Illustration: a single flowing brush stroke with an ink-blot accent.
  ribbon: {
    fills: [{ points: circle(93, 22, 3.4), kind: 'dot', tone: 1 }],
    strokes: [poly([8, 72, 24, 18, 46, 92, 60, 38, 70, 4, 84, 52, 93, 26])],
    tones: [],
    wordBand: 2.2,
  },
  // 3D: an isometric cube, lit from above, so each face gets its own tone.
  cube: {
    fills: [],
    strokes: [
      poly([50, 15, 80, 32, 80, 68, 50, 85, 20, 68, 20, 32, 50, 15]),
      poly([50, 49, 80, 32]),
      poly([50, 49, 20, 32]),
      poly([50, 49, 50, 85]),
    ],
    tones: [
      { points: poly([50, 15, 80, 32, 50, 49, 20, 32]), tone: 0.14 },
      { points: poly([20, 32, 50, 49, 50, 85, 20, 68]), tone: 0.45 },
      { points: poly([50, 49, 80, 32, 80, 68, 50, 85]), tone: 0.78 },
    ],
    strokeTone: 0.95,
  },
};

const DISCIPLINE_ART: Record<Discipline, { motif: MotifKey; technique: Technique }> = {
  Brand: { motif: 'seal', technique: 'hybrid' },
  Web: { motif: 'browser', technique: 'hybrid' },
  'UI/UX': { motif: 'face', technique: 'hybrid' },
  'Motion & Video': { motif: 'reel', technique: 'hybrid' },
  Illustration: { motif: 'ribbon', technique: 'hybrid' },
  '3D': { motif: 'cube', technique: 'shading' },
  'Creative Coding': { motif: 'chart', technique: 'hybrid' },
};

// Cells are tall (100/64 wide by 100/36 tall in the square motif), the same
// proportion as a terminal cell, which is what box-drawing glyphs expect.
export const GRID_COLS = 64;
export const GRID_ROWS = 36;
const CELL_W = 100 / GRID_COLS;
const CELL_H = 100 / GRID_ROWS;

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

export type HgLayerKind = 'words-light' | 'words-mid' | 'words-strong' | 'shade' | 'line';

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

function regionTone(p: Pt, motif: Motif, skipDots: boolean): number {
  let tone = 0;
  for (const fill of motif.fills) {
    if (skipDots && fill.kind === 'dot') continue;
    if (pointInPolygon(p, fill.points)) tone += fill.tone;
  }
  for (const region of motif.tones) if (pointInPolygon(p, region.points)) tone += region.tone;
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

    if (from.y === to.y) {
      const r = clampIndex(Math.floor(a.y), GRID_ROWS);
      const c0 = clampIndex(Math.floor(Math.min(a.x, b.x)), GRID_COLS);
      const c1 = clampIndex(Math.floor(Math.max(a.x, b.x)), GRID_COLS);
      for (let c = c0; c <= c1; c++) {
        if (c > c0 || c0 === c1) link(r, c, 'L');
        if (c < c1 || c0 === c1) link(r, c, 'R');
      }
      return;
    }
    if (from.x === to.x) {
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
        if (pointInPolygon({ x: (c + 0.5) * CELL_W, y: (r + 0.5) * CELL_H }, fill.points)) hits.push([r, c]);
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

function renderHybrid(motif: Motif, text: string): HgLayer[] {
  const glyphs = lineGlyphs(motif, ['dot']);
  const lines = blankGrid();
  const words = [blankGrid(), blankGrid(), blankGrid()];
  const strokesInCells = motif.strokes.map((line) => line.map((p) => ({ x: p.x / CELL_W, y: p.y / CELL_H })));
  let index = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (glyphs[r][c]) {
        lines[r][c] = glyphs[r][c];
        continue;
      }
      // A one-cell gutter either side of every line keeps it from being lost
      // among the letters.
      if ((c > 0 && glyphs[r][c - 1]) || (c < GRID_COLS - 1 && glyphs[r][c + 1])) continue;

      let tone = regionTone({ x: (c + 0.5) * CELL_W, y: (r + 0.5) * CELL_H }, motif, true);
      const band = motif.wordBand;
      if (tone < 0.03 && band && strokesInCells.some((line) => distToPolyline({ x: c + 0.5, y: r + 0.5 }, line) < band)) {
        tone = 0.5;
      }
      if (tone < 0.03) continue;

      // Only visible cells consume a character, so more of the article's real
      // words land inside the shape; a space becomes a middle dot rather than
      // punching a hole in it.
      const char = text[index % text.length];
      index += 1;
      words[tone < 0.3 ? 0 : tone < 0.62 ? 1 : 2][r][c] = /\s/.test(char) ? '·' : char;
    }
  }

  return [
    { kind: 'words-light', rows: toRows(words[0]) },
    { kind: 'words-mid', rows: toRows(words[1]) },
    { kind: 'words-strong', rows: toRows(words[2]) },
    { kind: 'line', rows: toRows(lines) },
  ];
}

function renderShading(motif: Motif): HgLayer[] {
  const samples = 4;
  const strokeHalfWidth = 0.42 * CELL_H;
  const strokeTone = motif.strokeTone ?? 1;
  const grid = blankGrid();

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
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
      grid[r][c] = SHADE_RAMP[Math.min(SHADE_RAMP.length - 1, level)];
    }
  }

  return [{ kind: 'shade', rows: toRows(grid) }];
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

export function buildHypergraphicArt(slug: string, disciplines: readonly Discipline[], articleBody: string): HypergraphicArt {
  const random = createRandom(hashString(slug));
  const { motif, technique } = DISCIPLINE_ART[disciplines[0]] ?? DISCIPLINE_ART.Brand;
  const layers =
    technique === 'shading'
      ? renderShading(MOTIFS[motif])
      : renderHybrid(MOTIFS[motif], cleanArticleText(articleBody) || 'the only');
  const gradientVariant = GRADIENT_VARIANTS[Math.floor(random() * GRADIENT_VARIANTS.length)];
  return { gradientVariant, layers };
}

const CANVAS_W = 800;
const CANVAS_H = 420;
// The motif is always a square (100x100 units scaled uniformly) centered in
// this box at min(w, h), so keeping w === h wastes none of it on margin.
const MOTIF_BOX = { x: 230, y: 40, w: 340, h: 340 };

export const HYPERGRAPHY_CANVAS = { width: CANVAS_W, height: CANVAS_H, motifBox: MOTIF_BOX };
