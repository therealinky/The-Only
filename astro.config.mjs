// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';

// Astro config does not support the Vite-style factory-function export, so
// the running command is read directly from argv instead of a `command`
// callback argument.
const isDevCommand = process.argv.slice(2).includes('dev');

const integrations = [mdx(), sitemap()];

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
});
