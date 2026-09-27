# Launch checklist

Everything below needs your credentials or a decision — none of it can be done from here.

## Required before launch

- [x] **GitHub repository.** Live at [therealinky/The-Only](https://github.com/therealinky/The-Only) (public — made
      public specifically so branch protection is available on the free plan; see next item).
- [x] **Branch protection on `main`.** Enabled via the GitHub API: a pull request is required before merging,
      direct pushes to `main` are blocked. See the README's
      [Branch protection](README.md#branch-protection-recommended) section.
- [x] **Cloudflare Pages project.** Connected to the GitHub repo, build command `npm run build`, output directory
      `dist`.
- [x] **Environment variables on Cloudflare Pages** (Production): `SITE_URL=https://theonly.bemosu.com`,
      `NODE_VERSION=22`.
- [x] **DNS record for `theonly.bemosu.com`.** Live and verified: resolves correctly across resolvers, HTTPS
      responds 200, SSL certificate valid (issued by Google Trust Services, auto-renews).
- [x] **Editor name.** `defaultAuthor` in [`src/config/site.ts`](src/config/site.ts) is now "Ana M. Rivas".
      `defaultReviewedBy` is deliberately left as the placeholder — it's the sentinel the build checks to catch an
      article that was never actually reviewed, so it shouldn't be set to a real name (see the comment in
      `site.ts`). Every `published` article still needs a real `reviewedBy` filled in by hand; the build enforces
      this either way.

## Decisions, not blockers

- [ ] **Newsletter provider.** Not chosen and nothing is built (see the README's
      [Email digest](README.md#email-digest-not-yet-built) section) — pick one when you're ready, or skip it
      indefinitely. `NEWSLETTER_PROVIDER` stays unset either way until then.
- [ ] **Analytics.** None is wired up. If you want any, a cookieless option (Cloudflare Web Analytics is free and
      built into Pages with no config file needed, or Plausible/Fathom if you want something more featured) fits
      the site's "no third-party tracking by default" posture better than Google Analytics. Your call, and not
      required to launch.

## Already done, nothing needed from you

- Content schema and build rules (`src/content.config.ts`)
- Keystatic local-mode editing at `/keystatic`, matching the schema
- Pagefind search, generated at build time
- Visual identity: self-hosted OFL fonts, light/dark themes with WCAG AA-checked contrast, restrained motion
  respecting `prefers-reduced-motion`
- Open Graph images generated at build time from the site's own typography/colors
- SEO: sitemap, RSS, canonical URLs, JSON-LD
- Accessibility: axe-core audit run against every page type — zero violations after one fix (see the README's
  [Accessibility](README.md#accessibility) section)
- 6 example placeholder articles (`example: true`) — excluded from any real production build automatically

## The site is live

**https://theonly.bemosu.com** — everything in "Required before launch" is done. The only things left are the
optional decisions above, whenever you're ready for them.
