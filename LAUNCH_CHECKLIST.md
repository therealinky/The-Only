# Launch checklist

Everything below needs your credentials or a decision — none of it can be done from here.

## Required before launch

- [ ] **GitHub repository.** Create one and push this repo to it (`git init` has already been run locally; no
      commits exist yet). Decide public or private.
- [ ] **Branch protection on `main`.** Once the repo is on GitHub: **Settings → Branches → Add branch protection
      rule** → branch name `main` → enable **Require a pull request before merging**. See the README's
      [Branch protection](README.md#branch-protection-recommended) section for why this matters — without it, the
      "merging is the only way anything goes live" promise in the editorial policy isn't actually enforced.
- [ ] **Cloudflare Pages project.** Connect the GitHub repo (**Workers & Pages → Create → Pages → Connect to Git**).
      Build command `npm run build`, output directory `dist`. Full steps in the README's
      [Deploying to Cloudflare Pages](README.md#deploying-to-cloudflare-pages) section.
- [ ] **Environment variables on Cloudflare Pages** (Production environment): `SITE_URL=https://theonly.bemosu.com`,
      `NODE_VERSION=22`.
- [ ] **DNS record for `theonly.bemosu.com`.** Add the custom domain in Cloudflare Pages
      (**Custom domains**) and point DNS at it — this needs access to bemosu.com's DNS, which is yours to grant.
- [ ] **Editor name.** Replace the `"Editor name (set in config)"` placeholder in
      [`src/config/site.ts`](src/config/site.ts) (`defaultAuthor` / `defaultReviewedBy`) with a real name. Every
      `published` article needs a real `reviewedBy` anyway (the build enforces it), but this default is what
      drafts start with.

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
