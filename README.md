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
| `NEWSLETTER_PROVIDER` | unset | Weekly digest signup. See [Email digest](#email-digest-not-yet-built) — leave unset; nothing is built yet |

`astro dev` always shows `draft` and `example` articles regardless of these flags, since local dev is where you
preview unpublished work.

## Content model

Every article is a Markdown/MDX file in `src/content/articles/`, validated against the schema in
[`src/content.config.ts`](src/content.config.ts) — that file is the source of truth for every field. A few build
rules are enforced there too, not just documented: a `published` article without `reviewedBy`, `sources`, or (for
Test/Workflow) a `summary` fails the build with a specific error; `evidence: tested` requires format `test` or
`workflow`; `withdrawn` requires a `withdrawnNote`.

Formats: **Brief** (a concise sourced update), **Test** (a hands-on assessment), **Workflow** (a repeatable
tutorial). Evidence levels: **Announced** (reported by the maker), **Researched** (checked against sources),
**Tested** (hands-on tested by us). Difficulty is a required effort-to-try rating, not a skill level: **Quick**
(nothing to set up), **Moderate** (worth a focused session), **Involved** (a real time investment).

Every article's summary, effort rating, tools, and "before you use it" checklist render together in a single,
visually distinct sidebar (see `ArticleSidebar.astro`), not inline in the article body.

### Writing an article by hand

1. Copy the frontmatter shape from any existing file in `src/content/articles/` (or see the schema directly).
2. Set `status: draft` while you work — draft articles render only in `astro dev`, never in a build.
3. Fill in `beforeYouUse` honestly; use the literal string `"not verified"` for anything you haven't checked, rather
   than guessing.
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

## Email digest (not yet built)

The Brief page has a spot for a weekly digest signup, and the config flag for it exists
(`NEWSLETTER_PROVIDER` in `.env.example`), but **no signup form, email collection, or provider integration has been
built** — the component in `src/components/NewsletterSignup.astro` renders nothing at all until that variable is
set.

Wiring up a real one later means: picking an RSS-to-email provider (services like Buttondown, ConvertKit, or
Mailcoach all support "email me your RSS feed weekly" out of the box) or something with a subscribe API, then
adding that provider's form fields/endpoint to `NewsletterSignup.astro` and setting `NEWSLETTER_PROVIDER`. None of
that is decided here on purpose — it's a decision for whoever picks the provider.

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
   - Leave `SHOW_EXAMPLES` and `NEWSLETTER_PROVIDER` unset.
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

Known gaps to check again as real content and images are added: alt text isn't yet exercised anywhere (there are no
images in the current placeholder content — Astro/MDX pass through standard Markdown `alt` text as-is, so this is a
process reminder for writers, not a code gap), and Keystatic's own admin UI at `/keystatic` was not audited (it's a
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
