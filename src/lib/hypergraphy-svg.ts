// Turns the art's character layers into SVG, in two forms:
// - inline: the article page hero. Colors come from theme tokens and
//   animation from src/styles/hypergraphy.css.
// - standalone: a self-contained .svg file for article cards, loaded as an
//   <img>, which can't see the page's CSS, so colors are written in.
import type { Discipline } from '../config/site';
import { buildHypergraphicArt, HYPERGRAPHY_CANVAS, type ArticleArt, type GradientVariant, type HgLayer } from './hypergraphy';

const STOP_TOKENS = ['--hero-purple', '--hero-blue', '--hero-sage', '--hero-gold', '--hero-rose', '--hero-purple'];

// Mirrors the --hero-* values in src/styles/tokens.css, which a standalone
// SVG file can't read.
const LIGHT_HUES: Record<string, string> = {
  '--hero-purple': '#6d5fc7',
  '--hero-rose': '#c1618c',
  '--hero-sage': '#4a9172',
  '--hero-blue': '#5f84c9',
  '--hero-gold': '#c4a874',
};
const DARK_HUES: Record<string, string> = {
  '--hero-purple': '#8f7ff0',
  '--hero-rose': '#d982ab',
  '--hero-sage': '#5fb98c',
  '--hero-blue': '#7fa3e0',
  '--hero-gold': '#d9be8f',
};

// Cards show the art at under half the hero's size, so text is a little
// stronger than the hero's equivalents in hypergraphy.css.
const LAYER_STYLE: Record<HgLayer['kind'], string> = {
  detail: 'fill-opacity:0.35',
  'words-light': 'fill-opacity:0.6;font-weight:500',
  'words-mid': 'fill-opacity:0.85;font-weight:600',
  'words-strong': 'fill-opacity:1;font-weight:800',
};

// Crop marks are box-drawing characters, outside the site's Latin-only font
// subset, so they're placed at exact cells; every other layer is Latin.
const POSITIONED: readonly HgLayer['kind'][] = ['detail'];

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Positioned layers place each character at its own cell, which keeps
// characters from fallback fonts (widths vary by platform) on the grid; the
// others are stretched to the full width.
function textElements(layers: HgLayer[], classFor: (kind: HgLayer['kind']) => string, animate: boolean): string {
  const { width, cellW, cellH } = HYPERGRAPHY_CANVAS;
  const out: string[] = [];
  for (const layer of layers) {
    layer.rows.forEach((row, rowIndex) => {
      if (!row.trim()) return;
      const y = ((rowIndex + 0.82) * cellH).toFixed(2);
      const delay = animate ? ` style="--hg-delay: ${rowIndex * 25}ms"` : '';
      if (POSITIONED.includes(layer.kind)) {
        const xs: string[] = [];
        let content = '';
        [...row].forEach((char, col) => {
          if (char === ' ') return;
          content += char;
          xs.push((col * cellW).toFixed(2));
        });
        out.push(`<text class="${classFor(layer.kind)}" x="${xs.join(' ')}" y="${y}"${delay}>${escapeXml(content)}</text>`);
      } else {
        out.push(
          `<text class="${classFor(layer.kind)}" x="0" y="${y}" textLength="${width}" lengthAdjust="spacingAndGlyphs" xml:space="preserve"${delay}>${escapeXml(row)}</text>`,
        );
      }
    });
  }
  return out.join('');
}

export interface ArtInput {
  slug: string;
  disciplines: readonly Discipline[];
  body: string;
  art?: ArticleArt;
}

export function renderInlineArt(input: ArtInput): { gradientVariant: GradientVariant; svg: string } {
  const { gradientVariant, layers } = buildHypergraphicArt(input.slug, input.disciplines, input.body, input.art);
  const { width, height, cellH } = HYPERGRAPHY_CANVAS;
  const id = `hg-iridescent-${input.slug}`;
  const stops = STOP_TOKENS.map(
    (token, i) => `<stop offset="${(i * 100) / (STOP_TOKENS.length - 1)}%" style="stop-color: var(${token})"/>`,
  ).join('');
  // objectBoundingBox (the default) maps the gradient to each row's own
  // bounding box, so every row shows its own color sweep.
  const svg =
    `<svg class="hg-art__svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="--hg-gradient: url(#${id})">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0.6">${stops}</linearGradient></defs>` +
    `<g font-size="${(cellH * 0.92).toFixed(2)}" xml:space="preserve">` +
    textElements(layers, (kind) => `hg-text hg-text--${kind}`, true) +
    '</g></svg>';
  return { gradientVariant, svg };
}

export function renderStandaloneArt(input: ArtInput): string {
  const { layers } = buildHypergraphicArt(input.slug, input.disciplines, input.body, input.art);
  const { width, height, cellH } = HYPERGRAPHY_CANVAS;
  const stops = STOP_TOKENS.map((_, i) => `<stop offset="${(i * 100) / (STOP_TOKENS.length - 1)}%" class="s${i}"/>`).join('');
  const stopRules = (hues: Record<string, string>) =>
    STOP_TOKENS.map((token, i) => `.s${i}{stop-color:${hues[token]}}`).join('');
  const layerRules = Object.entries(LAYER_STYLE)
    .map(([kind, style]) => `.k-${kind}{${style}}`)
    .join('');
  const style =
    `text{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre;fill:url(#g)}` +
    layerRules +
    stopRules(LIGHT_HUES) +
    `@media (prefers-color-scheme:dark){${stopRules(DARK_HUES)}}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<style>${style}</style>` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0.6">${stops}</linearGradient></defs>` +
    `<g font-size="${(cellH * 0.92).toFixed(2)}" xml:space="preserve">` +
    textElements(layers, (kind) => `k-${kind}`, false) +
    '</g></svg>'
  );
}
