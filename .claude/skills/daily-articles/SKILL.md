---
name: daily-articles
description: Research real, recent AI-for-design-tools news and draft up to a few sourced Brief articles for The Only as a PR-ready batch. Never publishes automatically and never merges — always leaves status: draft and opens a pull request for human review. Used by the daily automated-drafting Routine; can also be run manually anytime a fresh batch of drafts is wanted.
---

# Daily articles

Draft the day's batch of articles for The Only, following the same standards as the site's existing content, then hand them off for human review. This skill only produces drafts and opens a PR. It never sets `status: published`, never fills in a real `reviewedBy`, and never merges anything. Publishing stays a human decision, per the site's Editorial Policy (`src/pages/editorial-policy.astro`).

## Non-negotiables

- **Draft only.** Every article this skill writes gets `status: draft`. Leave `author` and `reviewedBy` unset (they default correctly). Open a PR; do not merge it.
- **Brief format only.** Use `format: brief` with `evidence: announced` or `evidence: researched`. Never write `format: test` or `format: workflow`, and never set `evidence: tested` — those formats mean *we hands-on tried it*, which this workflow can't honestly do from research alone. If a topic looks like it deserves a real hands-on Test or Workflow later, say so in the final summary instead of writing it as one.
- **Soft target, not a quota.** Aim for around 3 articles per run, but fewer (including zero) is correct and better than padding with thin, repetitive, or weakly-sourced items. Never invent or stretch a topic just to hit a number.
- **Real, checkable sources only.** Every article needs at least one credible, dated source with a URL, ideally the maker's own changelog, blog, or community post. If you can't find a solid primary or near-primary source for something, skip it.

## Before researching

1. Skim `src/content/articles/` for tools, topics, and sources already covered recently, don't duplicate or restate something already published or drafted.
2. Check for existing open branches/PRs (e.g. anything under `articles/`) that might already be covering today's news, to avoid duplicate work.

## Research

Use web search for real, dated developments from roughly the last few days relevant to working designers, across disciplines: Brand, Web, UI/UX, Motion & Video, Illustration, 3D, Creative Coding. Vary tools and disciplines across runs rather than repeatedly covering the same ones. Good candidates are genuine product changes, not roundups, opinion pieces, or speculation.

## Writing each article

Follow `src/content.config.ts` exactly, it's the schema's source of truth. For each article:

- **Frontmatter**: `title`, `dek`, `format: brief`, `evidence`, `difficulty`, `status: draft`, `example: false`, `publishedAt`/`updatedAt`/`lastVerified` set to today, `disciplines`, `tools`, `sources` (title/url/accessed), `beforeYouUse` (all five fields).
- **`beforeYouUse`**: mark anything not independently confirmed as `"not verified: <what's actually unclear>"`. Be honest, not reassuring, this is the whole point of the field.
- **`difficulty`**: `quick` / `moderate` / `involved`, framed as effort to try (time investment), not skill level.
- **Voice**: conversational, like a colleague sharing a find, not a press release. No em dashes anywhere in the prose. Short paragraphs. Structure: a short intro, then `## What changed`, `## Why it matters for designers`, `## What to watch out for`. If you reference the before-you-use checklist, call it "the sidebar" (it renders beside the article on desktop, above it on mobile, never call it "above").
- **Filename/slug**: kebab-case, matches the article's `id`, descriptive of the specific development (not just the tool name).

## Validate before committing

- `npm run build` and `npx astro check` must both pass with zero errors.
- `grep "—"` across the new files should come back empty (no em dashes).

## Ship as a draft PR

1. Branch off the latest `main`: `articles/YYYY-MM-DD`.
2. Commit the new article files.
3. Push and open a PR. Title it something like "Draft: N new articles (Month Day)". Body: one line per article (title + one-sentence why it's worth a look) plus links to primary sources.
4. Do not merge. Do not change `status` to `published`.
5. End your final message with a short, notification-friendly summary (article titles + PR link), that message is what a reviewer sees first.

## If nothing is worth writing

It's fine, and expected sometimes, to open no PR at all and just report "no new well-sourced developments today." That's a correct outcome, not a failure to hit quota.
