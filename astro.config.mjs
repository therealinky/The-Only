// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

const SITE_URL = process.env.SITE_URL || 'http://localhost:4321';

// Astro config does not support the Vite-style factory-function export, so
// the running command is read directly from argv instead of a `command`
// callback argument.
const isDevCommand = process.argv.slice(2).includes('dev');

// Try It only has content once a hands-on Test article is published. Until
// then its pages stay out of the sitemap (they're also marked noindex, and
// hidden from the nav; see getNavItems in src/lib/articles.ts). The config
// runs before Astro's content layer, so this reads the article files directly.
const articlesDir = new URL('./src/content/articles/', import.meta.url);
const hasPublishedTest = readdirSync(articlesDir)
  .filter((name) => name.endsWith('.mdx') || name.endsWith('.md'))
  .some((name) => {
    const frontmatter = readFileSync(new URL(name, articlesDir), 'utf8').split(/^---$/m)[1] ?? '';
    return /^format:\s*["']?test["']?\s*$/m.test(frontmatter) && /^status:\s*["']?published["']?\s*$/m.test(frontmatter);
  });

const integrations = [
  mdx(),
  sitemap({
    filter: (page) => hasPublishedTest || !new URL(page).pathname.startsWith('/try-it/'),
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
