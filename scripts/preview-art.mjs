// Prints an article-art motif as plain text, for checking a new or edited
// motif without starting the site:
//   node --experimental-strip-types --no-warnings scripts/preview-art.mjs <motif> [slug]
// The slug only changes where the motif sits on the banner and the colors.
import { ART_MOTIFS, buildHypergraphicArt } from '../src/lib/hypergraphy.ts';

const [motif, slug = 'preview'] = process.argv.slice(2);
if (!ART_MOTIFS.includes(motif)) {
  console.error(`Unknown motif "${motif ?? ''}". Known motifs: ${ART_MOTIFS.join(', ')}`);
  process.exit(1);
}

const sample =
  'Designers are testing new AI tools across their whole workflow, from first sketches to final handoff, and the useful ones keep showing up in real projects. ';
const { layers } = buildHypergraphicArt(slug, sample.repeat(20), motif);
const rows = layers[0].rows.map((_, r) =>
  [...layers[0].rows[r]]
    .map((_, c) => {
      for (const layer of [...layers].reverse()) {
        const char = layer.rows[r][c];
        if (char !== ' ') return char;
      }
      return ' ';
    })
    .join('')
    .trimEnd(),
);
console.log(rows.join('\n'));
