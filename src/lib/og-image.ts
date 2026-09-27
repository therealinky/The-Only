import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori, { type Font } from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Mirrors the --hero-purple / --hero-blue gradient in hero.css. Satori can't
// read CSS custom properties, so these are duplicated here as literal values.
const COLORS = {
  purple: '#6d5fc7',
  blue: '#5f84c9',
  textMuted: 'rgba(255,255,255,0.75)',
  border: 'rgba(255,255,255,0.35)',
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
      loadWoff('@fontsource/unbounded/files/unbounded-latin-800-normal.woff'),
      loadWoff('@fontsource/inter/files/inter-latin-400-normal.woff'),
      loadWoff('@fontsource/inter/files/inter-latin-500-normal.woff'),
      loadWoff('@fontsource/inter/files/inter-latin-700-normal.woff'),
    ]).then(([unboundedBlack, interRegular, interMedium, interBold]) => [
      { name: 'Unbounded', data: unboundedBlack, weight: 800 as const, style: 'normal' as const },
      { name: 'Inter', data: interRegular, weight: 400 as const, style: 'normal' as const },
      { name: 'Inter', data: interMedium, weight: 500 as const, style: 'normal' as const },
      { name: 'Inter', data: interBold, weight: 700 as const, style: 'normal' as const },
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
  const titleFontSize = title.length > 70 ? 48 : title.length > 40 ? 56 : 66;

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundImage: `linear-gradient(155deg, ${COLORS.purple}, ${COLORS.blue})`,
        padding: '64px',
        fontFamily: 'Inter',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              padding: '40px',
              borderRadius: '28px',
              backgroundColor: 'rgba(255,255,255,0.14)',
              border: `1px solid ${COLORS.border}`,
            },
            children: [
              eyebrow
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Inter',
                        fontWeight: 700,
                        fontSize: 22,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#ffffff',
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
                    fontFamily: 'Unbounded',
                    fontWeight: 800,
                    fontSize: titleFontSize,
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                    color: '#ffffff',
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
                        fontSize: 26,
                        lineHeight: 1.4,
                        color: COLORS.textMuted,
                        maxHeight: '110px',
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
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        fontFamily: 'Unbounded',
                        fontWeight: 800,
                        fontSize: 28,
                        textTransform: 'uppercase',
                        color: '#ffffff',
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
                        fontSize: 20,
                        color: COLORS.textMuted,
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
