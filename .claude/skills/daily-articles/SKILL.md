---
name: daily-articles
description: Research AI-for-design-tools news, evergreen techniques, and real community sentiment, and draft up to a few sourced articles for The Only as a PR-ready batch, a mix of news Briefs, researched Workflow write-ups (recent or long-established techniques), originated workflow ideas that combine multiple tools, and Pulse pieces synthesizing real Reddit/community discussion. Never publishes automatically and never merges — always leaves status: draft and opens a pull request for human review. Used by the daily automated-drafting Routine; can also be run manually anytime a fresh batch of drafts is wanted.
---

# Daily articles

Draft the day's batch of articles for The Only, following the same standards as the site's existing content, then hand them off for human review. This skill only produces drafts and opens a PR. It never sets `status: published`, never fills in a real `reviewedBy`, and never merges anything. Publishing stays a human decision, per the site's Editorial Policy (`src/pages/editorial-policy.astro`).

## Non-negotiables

- **Draft only.** Every article this skill writes gets `status: draft`. Leave `author` and `reviewedBy` unset (they default correctly). Open a PR; do not merge it.
- **Four content types, never Test, never `evidence: tested`.** Aim for a mix across a batch, not all Briefs, and not all recent news, either:
  - **Brief** (`format: brief`, `evidence: announced` or `researched`): a sourced update on real, recent news.
  - **Researched Workflow** (`format: workflow`, `evidence: researched`): a write-up of an existing technique someone has already published, ideally combining more than one tool. This does **not** need to be recent, a great technique from a tool that's been out for years is just as valid as one from last week. See "Writing a researched Workflow" below.
  - **Idea Workflow** (`format: workflow`, `evidence: researched`): an originated workflow or automation idea this skill assembles from tools' real, documented capabilities, not lifted from any single existing tutorial, often combining more than one tool (e.g. "have Copilot draft a weekly project summary and email it to you"). See "Writing an idea Workflow" below.
  - **Pulse** (`format: pulse`, `evidence: researched` always, enforced by the schema): a synthesis of real, current community discussion and sentiment about AI and design, gathered from Reddit and similar public spaces, not a single sourced change or technique. See "Writing a Pulse article" below.
  Never write `format: test`, and never set `evidence: tested` on anything, that means *we hands-on tried it ourselves*, which this skill can't honestly claim. If a topic looks like it deserves a real hands-on Test or a tested Workflow later, say so in the final summary instead of writing it as one.
- **Soft target, not a quota.** Aim for around 3 articles per run, but fewer (including zero) is correct and better than padding with thin, repetitive, or weakly-sourced items. Never invent or stretch a topic just to hit a number.
- **Real, checkable sources only.** Every article needs at least one credible, dated source with a URL, ideally the maker's own changelog, blog, or community post. A researched Workflow needs the original creator's own tutorial/post/video. An idea Workflow needs a separate real source confirming each individual tool capability it relies on, since nobody has published the combination itself. A Pulse piece needs several (not just one) real, dated, linkable community posts/comments, since a single comment isn't "sentiment." If you can't find a solid primary or near-primary source for something, skip it.
- **Never invent a specific number, count, tier, or named system that isn't actually stated in a source.** This has caused real problems: a fabricated "88 exposed tools" figure, an invented "read-only vs write/delete, always-allow/ask/block" permission system, and made-up ongoing AI credit numbers all made it into drafts before being caught in review. If a source describes something vaguely ("you can configure permissions further," "more than 100 new tools and controls" for a whole release), describe it exactly that vaguely, don't sharpen it into a precise-sounding specific to make the writing feel more concrete. A specific number is only safe to write down if you can point to the exact sentence in a source that states it. When in doubt, quote or closely paraphrase the source's own level of precision instead of adding your own.

## Before researching

1. Skim `src/content/articles/` for tools, topics, sources, and workflows already covered recently, don't duplicate or restate something already published or drafted.
2. Check for existing open branches/PRs (e.g. anything under `articles/`) that might already be covering today's news, to avoid duplicate work.

## Research

Cover working designers across disciplines: Brand, Web, UI/UX, Motion & Video, Illustration, 3D, Creative Coding. Vary tools and disciplines across runs rather than repeatedly covering the same ones. Recency requirements differ by type, see below, only Brief is actually tied to "the last few days."

- Good **Brief** candidates are genuine product changes from roughly the last few days, not roundups, opinion pieces, or speculation.
- Good **researched Workflow** candidates are a real, specific, repeatable technique someone has already published (a blog post, a creator's own tutorial, a community thread, a video walkthrough) that a working designer could follow step by step, not a vague "tips" listicle. **Recency doesn't matter here** — a technique for a tool that's been around for years is just as good a candidate as one from last week, as long as it's genuinely useful and not already covered. Actively look for ones that chain more than one tool together (e.g. a Figma-to-video pipeline, an agent that reads a CMS and posts to a design tool), not just single-tool tutorials, and actively look for new ways of using tools designers already have, not only what's new in the tool itself.
- Good **idea Workflow** candidates come from noticing that two or more tools each document a real capability that nobody's written up combined yet: an assistant's ability to read one system plus its ability to act in another, a scheduling or automation feature paired with a data source. Look at each tool's own docs, changelogs, or feature/API reference pages for capabilities designers might not know exist, then think about what a working designer could build by connecting them. The bar is "every individual piece of this is real and sourced," not "someone has done exactly this." Not tied to recency either.
- Good **Pulse** candidates come from actually reading design-adjacent communities, not just vendor channels: subreddits like r/graphic_design, r/UXDesign, r/UI_Design, r/FigmaDesign, r/artificial, r/ArtificialInteligence, and similar; Hacker News comment threads on AI-and-design stories; public designer Slack/Discord posts if findable; Designer News. Look for a genuine, current pattern in what people are actually saying (a shared frustration, a recurring workaround, a debate, a shift in how a tool's being used in practice), not a single loud comment. Cross-check that the sentiment is real by finding more than one independent thread or comment expressing something similar, not just one person's opinion.

## Writing each article

Follow `src/content.config.ts` exactly, it's the schema's source of truth. For each article:

- **Frontmatter**: `title`, `dek`, `format` (`brief`, `workflow`, or `pulse`), `evidence`, `difficulty`, `status: draft`, `example: false`, `publishedAt`/`updatedAt`/`lastVerified` set to today, `disciplines`, `tools`, `sources` (title/url/accessed), `beforeYouUse` (all five fields). A `workflow` also needs a complete `summary` (`whatChanged`, `whyItMatters`, `bestFor`, `timeToTry`) — the schema rejects a workflow without one. A `pulse` doesn't need a `summary`, same as `brief`.
- **`beforeYouUse`**: mark anything not independently confirmed as `"not verified: <what's actually unclear>"`. Be honest, not reassuring, this is the whole point of the field. For a `pulse` piece that isn't centered on one tool, it's fine for fields to say something like `"not applicable: this piece covers community sentiment, not a specific tool's client-data handling"`, still fill in every field honestly rather than leaving a placeholder.
- **`difficulty`**: `quick` / `moderate` / `involved`, framed as effort to try (time investment), not skill level. A `pulse` piece is almost always `quick`, there's nothing to try, just something to read.
- **`tools`**: for a `pulse` piece, list whatever tools actually came up in the discussion being covered; it's fine for this to be a short list or even empty if the discussion wasn't tool-specific.
- **Voice**: conversational, like a colleague sharing a find, not a press release. No em dashes anywhere in the prose. Short paragraphs. If you reference the before-you-use checklist, call it "the sidebar" (it renders beside the article on desktop, above it on mobile, never call it "above"). Structure by type:
  - **Brief**: short intro, then `## What changed`, `## Why it matters for designers`, `## What to watch out for`.
  - **Researched Workflow**: short intro crediting the original source, then numbered steps, then `## Why it matters for designers` and `## What to watch out for`.
  - **Idea Workflow**: short intro that says plainly this is an idea assembled from separately documented capabilities, not a workflow this publication has built or tested, then numbered steps (as concrete as the underlying docs support), then `## Why it matters for designers` and `## What to watch out for`.
  - **Pulse**: short intro naming the actual pattern in the discussion (not just "people are talking about X"), then `## What people are saying` (paraphrased themes with attribution and links, short direct quotes only where a paraphrase would lose something), then `## Why it matters for designers`, then `## What to watch out for` (see "Writing a Pulse article" below for the honesty bar this needs).
- **Filename/slug**: kebab-case, matches the article's `id`, descriptive of the specific development or technique (not just the tool name).

## Writing a researched Workflow without infringing copyright

A researched Workflow describes someone else's already-published technique. Facts and step sequences aren't copyrighted, but the *specific way someone expressed them* (their exact wording, their screenshots, their code or prompt text) is. Follow all of these:

- **Write every step in your own original wording.** Never paraphrase the source sentence by sentence, and never copy its captions or transitions. Rebuild the sequence of actions as your own explanation.
- **Never reuse the source's screenshots, diagrams, or images.** If a visual is genuinely needed, note in the PR body that a reviewer should add one (their own, or licensed), don't pull the original's.
- **Never reproduce someone else's code or prompt text verbatim beyond a short, clearly necessary snippet, quoted and attributed.** If a full prompt or script is the whole point, describe what it does and link to the source rather than reposting it.
- **Credit the original creator by name, prominently, in the article body itself, not only in `sources`.** Something like "This workflow comes from [name]'s [post/video] on..." near the top. Attribution isn't optional decoration here, it's what makes this an honest write-up instead of a copy.
- **Add real value beyond restating the source**: the "before you use it" checklist for a working-designer audience, caveats you noticed, a tool substitution, what's changed since the original was published. If you can't add anything beyond retelling the steps, it's not worth writing.
- **Evidence stays `researched`, not `tested`.** Say plainly in the intro that this describes someone else's published workflow, not one this publication has hands-on verified.
- **If a workflow can't be responsibly described without copying the source's specific expression** (e.g. it's a purely visual, screenshot-driven tutorial with no describable step logic), skip it rather than force it.

## Writing an idea Workflow (an originated combination, not a sourced technique)

An idea Workflow proposes something nobody's published: a way of combining tools' real, documented capabilities into a workflow a designer could set up. There's no copyright risk here (it's not describing someone else's specific expression), but there's a bigger accuracy risk: nobody, including this skill, has confirmed the combination actually works end to end. Follow all of these:

- **Source every individual capability separately, from each tool's own docs, changelog, or feature/API reference.** If tool A supposedly can read X and tool B can act on Y, both of those need their own real, dated, checkable source. Never assume a capability exists because it seems plausible.
- **Disclose plainly, near the top of the article, that this is a proposed idea, not a workflow this publication built or tested.** Something like "We haven't set this up ourselves, this combines features documented separately by each tool below." This is the single most important sentence in the piece, don't bury it.
- **Be concrete where the docs support it, honest where they don't.** Write real, specific steps (which setting, which feature, roughly how to connect them) rather than staying abstract, but don't invent exact UI details neither tool's documentation confirms.
- **Flag integration risk explicitly in "What to watch out for."** Tools built independently of each other can hit friction that no single tool's docs would mention: authentication scopes, rate limits, formatting mismatches, a feature being region- or plan-gated. Say plainly that this hasn't been end-to-end verified and the reader is the first one connecting these particular dots.
- **`beforeYouUse` should reflect the same honesty**, most fields will likely be `"not verified: ..."` since nobody, including this publication, has run the combined workflow.
- **Evidence stays `researched`, never `tested` or `announced`.** It's grounded in real, sourced capabilities, but the combination itself is unverified.
- **If a capability central to the idea can't be sourced, don't publish it, or scale the idea back to only the confirmed parts.** An idea resting on an assumed capability isn't a real idea Workflow, it's speculation.

## Writing a Pulse article (community sentiment, not a sourced technique or change)

A Pulse piece reports on what real people are actually saying, not on a change, a technique, or an idea. That makes it easy to accidentally overstate ("designers are furious about X") or misrepresent a single opinion as a consensus. Follow all of these:

- **Represent a real pattern, not one loud comment.** Find more than one independent thread, post, or comment expressing something similar before calling it a pattern. If you can only find one, it's an anecdote, not sentiment, skip it or say plainly it's a single data point.
- **Paraphrase in your own words; quote sparingly and short.** A short, clearly-attributed quote (a sentence, not a paragraph) is fine when it says something better than a paraphrase would. Never reproduce a long comment or post verbatim, and never string together multiple quotes to reconstruct most of someone's writing.
- **Link to the actual thread or comment for every claim**, in `sources`, so a reader (or reviewer) can verify the sentiment is real and see the full context, not just the sliver you picked.
- **Represent disagreement honestly.** If a thread has real pushback or a split opinion, say so, don't flatten a mixed discussion into a single tidy takeaway.
- **Never use a Reddit user's real name or identifying details beyond their username**, and don't editorialize about who they are, just what they said.
- **`beforeYouUse` still applies**, framed around the discussion's topic rather than a single tool (see the frontmatter guidance above).
- **Evidence stays `researched`, always.** This is enforced by the schema, but the intro should also say plainly that this is a synthesis of public discussion, not a tested or maker-announced fact.

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
