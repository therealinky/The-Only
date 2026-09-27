import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori, { type Font } from 'satori';
import { Resvg } from '@resvg/resvg-js';

const COLORS = {
  bg: '#faf6ef',
  text: '#211b14',
  textMuted: '#5b5346',
  accent: '#c2410c',
  accent2: '#0f766e',
  border: '#dcd3c0',
};

const WIDTH = 1200;
const HEIGHT = 630;

let fontsPromise: Promise<Font[]> | null = null;

// Satori's bundled font parser can't read the `fvar`/`name` tables of these
// families' variable builds, so the OG-image renderer uses the static
// (non-variable) weight files instead — same OFL-licensed typefaces, just a
// build-time-only rendering detail. The live site still uses the full
// variable fonts (see fonts.css).
//
// Resolved from process.cwd() rather than import.meta.url: astro build
// bundles this module into a chunk under dist/.prerender/, which would
// otherwise change what a relative `../../node_modules` path points to.
// process.cwd() is the project root for both `astro dev` and `astro build`.
async function loadWoff(pkgPath: string): Promise<Buffer> {
  return readFile(join(process.cwd(), 'node_modules', pkgPath));
}

async function loadFonts(): Promise<Font[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      loadWoff('@fontsource/fraunces/files/fraunces-latin-600-normal.woff'),
      loadWoff('@fontsource/fraunces/files/fraunces-latin-400-normal.woff'),
      loadWoff('@fontsource/inter/files/inter-latin-400-normal.woff'),
      loadWoff('@fontsource/inter/files/inter-latin-500-normal.woff'),
      loadWoff('@fontsource/space-mono/files/space-mono-latin-700-normal.woff'),
    ]).then(([frauncesSemibold, frauncesRegular, interRegular, interMedium, monoBuf]) => [
      { name: 'Fraunces', data: frauncesSemibold, weight: 600 as const, style: 'normal' as const },
      { name: 'Fraunces', data: frauncesRegular, weight: 400 as const, style: 'normal' as const },
      { name: 'Inter', data: interRegular, weight: 400 as const, style: 'normal' as const },
      { name: 'Inter', data: interMedium, weight: 500 as const, style: 'normal' as const },
      { name: 'Space Mono', data: monoBuf, weight: 700 as const, style: 'normal' as const },
    ]);
  }
  return fontsPromise;
}

interface OgTemplateOptions {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

function buildTemplate({ eyebrow, title, subtitle }: OgTemplateOptions) {
  const titleFontSize = title.length > 70 ? 52 : title.length > 40 ? 60 : 72;

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: COLORS.bg,
        padding: '64px',
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', width: '100%', height: '10px', backgroundColor: COLORS.accent },
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '20px' },
            children: [
              eyebrow
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Space Mono',
                        fontSize: 24,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: COLORS.accent,
                      },
                      children: eyebrow,
                    },
                  }
                : null,
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontFamily: 'Fraunces',
                    fontWeight: 600,
                    fontSize: titleFontSize,
                    lineHeight: 1.15,
                    color: COLORS.text,
                    maxHeight: '320px',
                    overflow: 'hidden',
                  },
                  children: title,
                },
              },
              subtitle
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontWeight: 400,
                        fontSize: 28,
                        lineHeight: 1.4,
                        color: COLORS.textMuted,
                        maxHeight: '120px',
                        overflow: 'hidden',
                      },
                      children: subtitle,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        title === 'The Only'
          ? null
          : {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: `2px solid ${COLORS.border}`,
                  paddingTop: '24px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Fraunces',
                        fontWeight: 600,
                        fontSize: 32,
                        color: COLORS.text,
                      },
                      children: 'The Only',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontWeight: 500,
                        fontSize: 22,
                        color: COLORS.accent2,
                      },
                      children: 'AI for Working Designers',
                    },
                  },
                ],
              },
            },
      ].filter(Boolean),
    },
  };
}

export async function renderOgImage(options: OgTemplateOptions): Promise<Buffer> {
  const fonts = await loadFonts();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(buildTemplate(options) as any, { width: WIDTH, height: HEIGHT, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } });
  return resvg.render().asPng();
}
