// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { existsSync, readFileSync } from 'node:fs';

// Astro config does not support the Vite-style factory-function export, so
// the running command is read directly from argv instead of a `command`
// callback argument.
const isDevCommand = process.argv.slice(2).includes('dev');

// Canonical tags, the sitemap, RSS, and share images are all built from this,
// so a production build must never fall back to localhost.
const SITE_URL = process.env.SITE_URL || (isDevCommand ? 'http://localhost:4321' : 'https://theonly.bemosu.com');

// A page marked noindex (empty listings, one-article tool pages, Try It before
// its first Test) stays out of the sitemap too. The sitemap is written after
// the pages, so this reads each built page's own tag.
const distDir = new URL('./dist/', import.meta.url);
/** @param {string} page */
const isNoindexed = (page) => {
  const file = new URL(`.${new URL(page).pathname}index.html`, distDir);
  return existsSync(file) && readFileSync(file, 'utf8').includes('<meta name="robots" content="noindex');
};

const integrations = [
  mdx(),
  sitemap({
    filter: (page) => !isNoindexed(page),
  }),
];

// Keystatic (and its React dependency) is a local-mode editing UI only.
// It is imported dynamically, and only for `astro dev`, so it is never
// resolved, bundled, or shipped as part of a production/preview build.
if (isDevCommand) {
  const [{ default: react }, { default: keystatic }] = await Promise.all([
    import('@astrojs/react'),
    import('@keystatic/astro'),
  ]);
  integrations.push(react(), keystatic());
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  integrations,
  // YouTube thumbnails for Media blocks are downloaded and optimized at
  // build time, so readers never load them from YouTube.
  image: {
    domains: ['i.ytimg.com'],
  },
  vite: {
    // The Lottie player is only loaded by a dynamic import when an animation
    // scrolls into view. Without this, the dev server discovers it late and
    // rejects that first request ("Outdated Optimize Dep"), so the Lottie
    // never loads in `astro dev`. Production builds aren't affected.
    optimizeDeps: {
      include: ['@lottiefiles/dotlottie-web'],
    },
  },
});
