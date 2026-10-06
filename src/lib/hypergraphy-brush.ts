// Hover "brush" for the article hero art: characters near the cursor shrink,
// then spring back with a slight overshoot once it moves on.
//
// The art ships as one SVG <text> per row (see hypergraphy-svg.ts), which
// keeps the page light but means single characters can't be transformed.
// So nothing changes at load. Once the intro fade has finished, on devices
// with a mouse or trackpad, each row is split into one <text> per character
// a few rows at a time while the browser is idle, placed exactly where it
// already was, with the row's gradient pinned so the colors don't shift.
// While the cursor moves, only the characters within the brush are touched.
// Off for touch-only devices and for prefers-reduced-motion.
//
// The grid size comes from data attributes on .hg-art rather than an import
// of hypergraphy.ts, which would pull the whole art generator into the
// browser bundle.
const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
// Brush radius, in rows.
const RADIUS_ROWS = 3.6;
// How small a character gets at the brush's center.
const MIN_SCALE = 0.3;
// The intro fades rows in one after another (each row's --hg-delay plus a
// 700ms fade); splitting waits for it so it isn't cut short.
const FADE_MS = 700;
// Rows split per idle slot.
const ROWS_PER_STEP = 6;

interface Glyph {
  el: SVGTextElement;
  cx: number;
  cy: number;
}

type IdleDeadline = { timeRemaining: () => number };
const whenIdle: (callback: (deadline: IdleDeadline) => void) => void =
  'requestIdleCallback' in window
    ? (callback) => window.requestIdleCallback(callback, { timeout: 1000 })
    : (callback) => window.setTimeout(() => callback({ timeRemaining: () => 8 }), 50);

function canBrush(): boolean {
  return (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function enableArtBrush(art: HTMLElement): void {
  if (!canBrush()) return;
  const svg = art.querySelector<SVGSVGElement>('.hg-art__svg');
  const defs = svg?.querySelector('defs');
  const shared = svg?.querySelector('linearGradient');
  const CANVAS_W = Number(art.dataset.canvasW);
  const CELL_W = Number(art.dataset.cellW);
  const CELL_H = Number(art.dataset.cellH);
  if (!svg || !defs || !shared || !CANVAS_W || !CELL_W || !CELL_H) return;
  const RADIUS = CELL_H * RADIUS_ROWS;

  const rows = [...svg.querySelectorAll<SVGTextElement>('text.hg-text')];
  let lastDelay = 0;
  for (const row of rows) lastDelay = Math.max(lastDelay, parseFloat(row.style.getPropertyValue('--hg-delay')) || 0);

  // Characters bucketed by grid cell, for quick lookups near the cursor.
  const buckets = new Map<number, Glyph[]>();
  const keyFor = (x: number, y: number) => Math.floor(y / CELL_H) * 1000 + Math.floor(x / CELL_H);

  function splitRow(row: SVGTextElement, rowIndex: number, box: DOMRect): void {
    const text = row.textContent ?? '';
    const y = Number(row.getAttribute('y'));
    const xs = (row.getAttribute('x') ?? '0').split(' ').map(Number);
    const stretched = row.hasAttribute('textLength');

    // The shared gradient maps to each row's own bounding box. Split
    // characters would each get their own tiny sweep, so the row gets a copy
    // fixed to that same box in user space instead.
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    const id = `${shared!.id}-r${rowIndex}`;
    gradient.id = id;
    gradient.setAttribute('href', `#${shared!.id}`);
    gradient.setAttributeNS(XLINK_NS, 'xlink:href', `#${shared!.id}`);
    gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
    gradient.setAttribute('gradientTransform', `matrix(${box.width} 0 0 ${box.height} ${box.x} ${box.y})`);
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('x2', '1');
    gradient.setAttribute('y2', '0.6');
    defs!.appendChild(gradient);

    const fragment = document.createDocumentFragment();
    const advance = stretched ? CANVAS_W / text.length : CELL_W;
    let positioned = 0;
    [...text].forEach((char, col) => {
      if (char === ' ') return;
      const x = stretched ? col * advance : xs[positioned++];
      const glyph = document.createElementNS(SVG_NS, 'text');
      glyph.setAttribute('class', `${row.getAttribute('class')} hg-char`);
      glyph.setAttribute('x', x.toFixed(2));
      glyph.setAttribute('y', String(y));
      if (stretched) {
        glyph.setAttribute('textLength', advance.toFixed(3));
        glyph.setAttribute('lengthAdjust', 'spacingAndGlyphs');
      }
      glyph.style.fill = `url(#${id})`;
      glyph.textContent = char;
      fragment.appendChild(glyph);

      const entry = { el: glyph, cx: x + advance / 2, cy: y - CELL_H * 0.32 };
      const key = keyFor(entry.cx, entry.cy);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(entry);
      else buckets.set(key, [entry]);
    });
    row.replaceWith(fragment);
  }

  // Splits a few rows per idle slot, so neither the script nor the browser's
  // drawing of the new characters adds up to a long task. Every row is
  // measured up front, so the browser lays the art out once, not per row.
  function startSplitting(): void {
    const boxes = rows.map((row) => row.getBBox());
    let next = 0;
    const step = (deadline: IdleDeadline) => {
      const stop = Math.min(rows.length, next + ROWS_PER_STEP);
      do splitRow(rows[next], next, boxes[next]);
      while (++next < stop && deadline.timeRemaining() > 2);
      if (next < rows.length) whenIdle(step);
    };
    whenIdle(step);
  }
  window.setTimeout(startSplitting, lastDelay + FADE_MS);

  let pressed = new Set<SVGTextElement>();
  let pointer: { x: number; y: number } | null = null;
  let queued = false;

  const release = (keep: Set<SVGTextElement>) => {
    for (const el of pressed) {
      if (keep.has(el)) continue;
      el.classList.remove('is-pressed');
      el.style.transform = '';
    }
    pressed = keep;
  };

  const frame = () => {
    queued = false;
    if (!pointer || buckets.size === 0) return;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(pointer.x, pointer.y).matrixTransform(matrix.inverse());

    const next = new Set<SVGTextElement>();
    const reach = Math.ceil(RADIUS / CELL_H);
    const row0 = Math.floor(point.y / CELL_H);
    const col0 = Math.floor(point.x / CELL_H);
    for (let r = row0 - reach; r <= row0 + reach; r++) {
      for (let c = col0 - reach; c <= col0 + reach; c++) {
        const bucket = buckets.get(r * 1000 + c);
        if (!bucket) continue;
        for (const { el, cx, cy } of bucket) {
          const distance = Math.hypot(cx - point.x, cy - point.y);
          if (distance >= RADIUS) continue;
          // Smooth falloff: full effect at the center, none at the edge.
          const t = 1 - (distance / RADIUS) ** 2;
          el.style.transform = `scale(${(1 - (1 - MIN_SCALE) * t * t).toFixed(3)})`;
          el.classList.add('is-pressed');
          next.add(el);
        }
      }
    }
    release(next);
  };

  art.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    pointer = { x: event.clientX, y: event.clientY };
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  });
  art.addEventListener('pointerleave', () => {
    pointer = null;
    release(new Set());
  });
}
