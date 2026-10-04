# The Only — AI for Working Designers

A practical field guide to AI for working designers: what changed, why it matters, what's worth trying, and what to
watch out for.

Astro (static output, TypeScript), Markdown/MDX content collections, Keystatic as a local-only editing UI, Pagefind
for search. No database, no server, no paid services.

## Requirements

- **Node 22.12+** (see `.nvmrc` — run `nvm use` if you use nvm)

## Local setup

```sh
nvm use
npm install
npm run dev
```

- Site: http://localhost:4321
- Local-only editing UI: http://localhost:4321/keystatic (never included in a production build — see
  [Local editing with Keystatic](#local-editing-with-keystatic))

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build to `dist/`, then generates the Pagefind search index as a postbuild step |
| `npm run preview` | Serves the production build locally, for a final check before deploying |
| `npm run check` | TypeScript diagnostics (`astro check`) |

## Environment variables

Copy `.env.example` to `.env` and adjust. All are optional with sensible defaults.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SITE_URL` | `http://localhost:4321` | Canonical site URL — used for canonical tags, sitemap, RSS, and Open Graph/JSON-LD URLs |
| `SHOW_EXAMPLES` | `false` | Set to `true` to include `example: true` placeholder articles in a build. Leave unset for a real production build |
| `NEWSLETTER_PROVIDER` | unset | The Brief email signup. See [Email digest](#email-digest); the form stays hidden until this is `buttondown` |

`astro dev` always shows `draft` and `example` articles regardless of these flags, since local dev is where you
preview unpublished work.

## Content model

Every article is a Markdown/MDX file in `src/content/articles/`, validated against the schema in
[`src/content.config.ts`](src/content.config.ts) — that file is the source of truth for every field. A few build
rules are enforced there too, not just documented: a `published` article without `reviewedBy`, `sources`, or (for
Test/Workflow) a `summary` fails the build with a specific error; `evidence: tested` requires format `test` or
`workflow`; `withdrawn` requires a `withdrawnNote`.

Formats: **Brief** (a concise sourced update), **Test** (a hands-on assessment), **Workflow** (a repeatable
tutorial), **Pulse** (a synthesis of real community discussion and sentiment, not tied to a single sourced
change — evidence is always `researched` for this one, enforced in `content.config.ts`). Evidence levels:
**Announced** (reported by the maker), **Researched** (checked against sources), **Tested** (hands-on tested by
us). Difficulty is a required effort-to-try rating, not a skill level: **Quick** (nothing to set up), **Moderate**
(worth a focused session), **Involved** (a real time investment).

Every article's summary, effort rating, tools, and "before you use it" checklist render together in a single,
visually distinct sidebar (see `ArticleSidebar.astro`), not inline in the article body.

### Writing an article by hand

1. Copy the frontmatter shape from any existing file in `src/content/articles/` (or see the schema directly).
2. Set `status: draft` while you work — draft articles render only in `astro dev`, never in a build.
3. Fill in `beforeYouUse` honestly, starting each field with `known:`, `not verified:`, or `not applicable:` (the
   sidebar shows that word as an icon and label). Use `not verified` for anything you haven't checked, rather than
   guessing.
4. Leave `author` unset — it defaults to the house byline in [`src/config/site.ts`](src/config/site.ts) and should
   stay that way; articles here are AI-drafted and human-reviewed, not written by a named individual. Leave
   `reviewedBy` unset while drafting too (it defaults to a placeholder). Before you set `status: published`, replace
   `reviewedBy` with the real name of the human who checked it, and add at least one source — the build enforces
   this.

### Writing an article with Keystatic

Run `npm run dev` and open http://localhost:4321/keystatic. It's the same schema as above, presented as a form —
useful for the body editor and for not having to remember YAML syntax, but it edits the exact same files you'd edit
by hand. It runs in **local mode only**: it reads and writes files on your machine, nothing is sent to Keystatic
Cloud or GitHub, and the integration that serves it is only loaded for `astro dev` (see `astro.config.mjs`), so it
adds nothing to a production build.

If Keystatic (or a page with a Lottie) opens as a blank page, the dev server's cache of pre-bundled dependencies has
gone stale, usually after a config or dependency change. The browser console shows `504 (Outdated Optimize Dep)`.
Stop the server (Control + C) and restart it with the cache cleared:

```sh
npx astro dev --force
```

If `localhost:4321` won't connect at all, try `http://127.0.0.1:4321/keystatic`: the dev server listens on that address,
and some browsers try a different form of `localhost` first.

### Adding media

Articles can include an image (PNG, JPG, WEBP), a GIF, a YouTube video, or a Lottie/dotLottie animation as a
**Media** block. The usual place is the end of a section (after "What changed", "Why it matters for designers",
and so on), but a block works anywhere in the body, e.g. inside a Workflow step. Sections without media just don't
get a block.

- **In Keystatic:** in the article's Content field, use the insert menu to add a **Media** block, pick its type, and
  upload the file (or paste the YouTube link). Keystatic saves uploads to the article's own folder,
  `src/assets/articles/<article-slug>/`, and writes the path into the block.
- **By hand:** put the file in `src/assets/articles/<article-slug>/` and add a block where it should appear:

  ```mdx
  <Media type="image" image="figma-motion-timeline.png" alt="The Motion timeline with three keyframed layers." caption="Styles applied from a shared library." credit="Image: Figma" />
  <Media type="gif" image="recolor-demo.gif" alt="…" />
  <Media type="youtube" youtube="https://www.youtube.com/watch?v=VIDEO_ID" alt="The video's title" />
  <Media type="lottie" file="loader.lottie" alt="…" trigger="click" />
  ```

  A bare filename works as long as no other article has a file with the same name; otherwise use the full path,
  e.g. `/src/assets/articles/<article-slug>/name.png`.

Every block needs `alt`: what the image or animation shows, for people who can't see it (for YouTube, the video's
title). `caption` and `credit` are optional, but give a credit whenever the media came from someone else. Only use
media we made, have permission for, or are allowed to embed (a YouTube video's own embed is fine; someone else's
screenshot isn't, unless they say so).

How each type behaves (`src/components/Media.astro`):

- **Images** are converted to AVIF/WebP and resized for each screen at build time, and lazy-loaded.
- **GIFs** are served as-is (converting would drop the animation), and the build warns over 2 MB. Visitors who ask
  their device for reduced motion see a still frame with a play button.
- **YouTube** shows a thumbnail (downloaded at build time, so readers never fetch it from YouTube) and only loads
  YouTube's privacy-enhanced (no-cookie) player when someone presses play.
- **Lottie/dotLottie** loads LottieFiles' player, and its WebAssembly engine served from this site, only when the
  animation scrolls near view. It's half the column width by default (`size="full"` for the full column; phones
  always get full width), and `trigger` sets what plays it:
  - `loop` (default): plays continuously, with a pause button.
  - `view`: plays once when it scrolls into view and stops on the last frame. Add `replay` to replay it each time.
  - `hover`: plays while hovered, rewinds when the pointer leaves. On touch screens a tap plays it and the next tap
    rewinds.
  - `click`: plays from the start on each click, tap, Enter, or Space.
  - `scroll`: its frame follows the page's scroll position.

  Hover and click Lotties are keyboard-focusable buttons with a small "Click to play" / "Hover to play" / "Tap to
  play" hint. For reduced-motion visitors, `loop` and `view` start paused and `scroll` shows the final frame; `hover`
  and `click` still work, since the reader starts them.

The build fails on a missing file, a missing alt text, or a link that isn't a YouTube video, so mistakes show up
before anything ships.

## Publishing workflow

Everything below happens through Git, VS Code (or any editor), and GitHub pull requests. **Merging a pull request
into `main` is the only way anything goes live.**

**Draft** — create a branch, add the article with `status: draft` (by hand or via Keystatic), and preview it locally
with `npm run dev`.

```sh
git checkout -b article/example-tool-x-review
```

**Review and edit** — before changing anything else, check the sources, the evidence level, and every field in
`beforeYouUse`. This is the step where you catch a `not verified` that should now be filled in, or an evidence
level that's too confident for what you actually checked.

**Approve** — change `status` to `published`, then open a pull request. Cloudflare Pages builds a preview
deployment for every PR automatically; open its preview URL and check the article as it will actually appear.

**Publish** — merge the pull request into `main`. That merge is what deploys to production.

**Update** — edit on a new branch, bump `updatedAt` (and `lastVerified` too, if you re-checked the underlying facts
without changing the conclusion), and go through the same PR flow.

**Withdraw** — on a branch, set `status: withdrawn` and write a `withdrawnNote` explaining why, then PR and merge as
usual. The article keeps its URL, but the page shows your withdrawal notice instead of the body, is marked
`noindex`, and drops out of listings, search, and RSS.

Anything AI-generated or imported — sourced by an assistant, drafted with help, whatever — arrives as a `draft` on
a branch like any other article. Nothing publishes without going through this same human review and a merged PR.

### Automated drafting

A scheduled Routine can run the [`daily-articles`](.claude/skills/daily-articles/SKILL.md) skill to research and
draft a batch of Brief articles on its own. It only ever produces `status: draft` articles and opens a PR, it never
sets `reviewedBy`, never sets `status: published`, and never merges, publishing still goes through the same Approve
and Publish steps above. The skill file is the source of truth for what it will and won't write; it can also be run
manually anytime with `/daily-articles`.

### Branch protection (recommended)

Turn this on once the repo is on GitHub, so nothing reaches `main` without a pull request:

1. GitHub repo → **Settings → Branches → Add branch protection rule**.
2. Branch name pattern: `main`.
3. Enable **Require a pull request before merging**.
4. Save.

This is what actually makes "merging is the only way anything goes live" true — without it, a direct push to
`main` bypasses the whole review step above.

## Search

Pagefind indexes the built site after every `npm run build` (see the `postbuild` script). Only article pages are
indexed — listing and filter pages are deliberately excluded (see `data-pagefind-body` in
`src/pages/articles/[slug].astro`) so search results land on the actual article, not a filtered view of it. Pagefind
only works against a real build; running `npm run build && npm run preview` is how to test search locally.

## Email digest

The Brief is also an email: every Wednesday, a hand-written summary of the most interesting stories from the past
seven days, composed and sent manually from **Buttondown's free plan**. (Its RSS-to-email feature needs a paid plan,
so it isn't used.) The site's only job is the signup form and a **Read past issues** link to Buttondown's public
archive at [buttondown.com/theonly/archive](https://buttondown.com/theonly/archive/); past issues live there, not on
this site. Keep the web archive switched on in Buttondown's settings, or that link breaks.

Both live in `NewsletterSignup.astro` on The Brief page. The Buttondown account is **`theonly`** ("The Only Brief"),
the default in `src/config/site.ts`; `NEWSLETTER_BUTTONDOWN_USERNAME` only needs setting to override it.

The form posts straight to Buttondown's public embeddable-subscribe endpoint
(`https://buttondown.com/api/emails/embed-subscribe/theonly`); there's no API key or secret involved, and no email
addresses ever touch this codebase or Cloudflare. The form and link render nothing at all until it's switched on:
set `NEWSLETTER_PROVIDER=buttondown` in Cloudflare Pages (**Settings → Environment variables**, Production), and in
`.env` to see it locally.

A different provider (ConvertKit, Mailcoach, etc.) would need its own branch in `NewsletterSignup.astro`, since
each one's embeddable form shape differs — not built, since only Buttondown is in use.

## Analytics

Cloudflare Web Analytics is wired up via the manual snippet in `src/layouts/BaseLayout.astro`, loaded only in
production builds (`import.meta.env.PROD`) so local dev and previews don't skew the numbers. It's cookieless and
doesn't track individual visitors — no consent banner needed. Dashboard: Cloudflare account →
**Web Analytics** → `theonly.bemosu.com`.

The site's custom domain is a subdomain of a zone on Cloudflare, so it didn't show up in Web Analytics'
"select from your existing websites" dropdown (that only lists root zones); typing `theonly.bemosu.com` in
manually and using the token it issued works the same way.

## Deploying to Cloudflare Pages

This prepares the config; it does not deploy anything.

1. Push the repo to GitHub (see the [launch checklist](LAUNCH_CHECKLIST.md)).
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick the repo.
3. Build settings:
   - Framework preset: **Astro** (or set manually below)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Environment variables (**Settings → Environment variables**, for the Production environment):
   - `SITE_URL` = `https://theonly.bemosu.com` (or whatever domain is live)
   - `NODE_VERSION` = `22` (Cloudflare's build image should also pick this up from `.nvmrc`, but setting it
     explicitly avoids relying on that)
   - `NEWSLETTER_PROVIDER` = `buttondown` once The Brief's email signup should go live (see
     [Email digest](#email-digest)); leave it unset until then.
   - Leave `SHOW_EXAMPLES` unset.
5. Deploy. Cloudflare gives every PR its own preview URL automatically once the project is connected — that's the
   preview URL referenced in the Publishing workflow's Approve step above.
6. Custom domain: **Custom domains → Set up a custom domain** → `theonly.bemosu.com`, and add the DNS record
   Cloudflare gives you at the domain's DNS provider (skip this step if the domain's DNS is already on Cloudflare —
   it can add the record for you directly).

No `wrangler.toml` or Pages Functions are needed — this is a fully static site, so Cloudflare just serves the
`dist` output directly. [`public/_headers`](public/_headers) adds a few baseline security headers
(`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, a minimal `Permissions-Policy`); Cloudflare Pages
picks this file up automatically.

## Accessibility

Built in throughout, not bolted on after: semantic landmarks, a skip link, visible focus styles, keyboard-operable
filters and search, `prefers-reduced-motion` support, and a color system whose contrast ratios (light and dark)
were calculated against WCAG AA before being used anywhere. This was verified with an automated pass (axe-core,
run against every page type in a live browser, including the withdrawn-article state) with **zero violations**
after one fix (a heading-order jump on listing pages, `h1` straight to `h3` — article cards now use `h2`). See the
project's audit notes for the full pass/fail list per page type.

Known gaps to check again as real content and images are added: Media blocks require alt text (the build fails
without it), but whether a given alt text is actually useful is a review step, not something the build can check.
Keystatic's own admin UI at `/keystatic` was not audited (it's a
vendored local-only tool, not part of the public site).

## Project structure

- `src/content/articles/` — article content (Markdown/MDX)
- `src/content.config.ts` — the schema and build rules (source of truth)
- `src/config/site.ts` — site name, descriptor, default author byline/reviewer placeholder, discipline/format/
  evidence/difficulty lists
- `src/pages/` — routes
- `src/components/`, `src/layouts/` — UI
- `src/lib/` — article querying/filtering helpers, OG image generation, date/slug utilities
- `keystatic.config.ts` — the local-mode editing UI, mirroring `content.config.ts`
