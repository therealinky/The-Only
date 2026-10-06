// Central site configuration. Editors change these values, not code.

export const SITE = {
  name: 'The Only',
  descriptor: 'AI Guide for Working Designers',
  description:
    "A practical field guide to AI for working designers: what changed, why it matters, what's worth trying, and what could go wrong.",
  url:
    import.meta.env?.SITE_URL ||
    (typeof process !== 'undefined' ? process.env.SITE_URL : undefined) ||
    'http://localhost:4321',
  // A house byline, not a person's name. Articles here are AI-drafted and
  // human-reviewed, not written by "Ana M. Rivas" or any other individual —
  // the accountable human goes in `reviewedBy` on each article instead. See
  // the Editorial Policy page and the README.
  defaultAuthor: 'The Only Editors',
  // Intentionally NOT the real editor name — content.config.ts treats a
  // published article whose reviewedBy still equals this placeholder as
  // "not actually reviewed yet" and fails the build. See the README.
  defaultReviewedBy: 'Editor name (set in config)',
  // Reader contact (a DreamHost forward-only address). Kept in two parts so
  // the full address never appears in the built HTML; ContactEmail.astro
  // assembles it in the browser. See the README's Contact section.
  contactEmail: { user: 'theonly', domain: 'bemosu.com' },
} as const;

// The Brief email. No signup form is shown, and no email addresses are
// collected, until NEWSLETTER_PROVIDER is set to "buttondown". See
// NewsletterSignup.astro and the README's Email digest section.
export const NEWSLETTER = {
  provider:
    import.meta.env?.NEWSLETTER_PROVIDER ||
    (typeof process !== 'undefined' ? process.env.NEWSLETTER_PROVIDER : undefined) ||
    null,
  // The Only Brief's own Buttondown account. Its subscribe form posts to a
  // public, per-account URL, so this isn't a secret.
  buttondownUsername:
    import.meta.env?.NEWSLETTER_BUTTONDOWN_USERNAME ||
    (typeof process !== 'undefined' ? process.env.NEWSLETTER_BUTTONDOWN_USERNAME : undefined) ||
    'theonly',
} as const;

// The main sections, in nav order. Shared by the header and the footer so
// the two can't drift apart.
export const NAV_ITEMS = [
  { href: '/', label: 'Latest' },
  { href: '/try-it/', label: 'Try It' },
  { href: '/workflows/', label: 'Workflows' },
  { href: '/the-pulse/', label: 'The Pulse' },
  { href: '/the-brief/', label: 'The Brief' },
  { href: '/tools/', label: 'The Toolkit' },
] as const;

export const DISCIPLINES = [
  'Brand & Graphic',
  'Web',
  'UI/UX',
  'Motion & Video',
  'Photo & Imaging',
  'Illustration',
  '3D',
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export const FORMATS = ['brief', 'test', 'workflow', 'pulse'] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_LABELS: Record<Format, string> = {
  brief: 'Brief',
  test: 'Test',
  workflow: 'Workflow',
  pulse: 'Pulse',
};

export const FORMAT_DESCRIPTIONS: Record<Format, string> = {
  brief: 'A concise, sourced update on something that changed.',
  test: 'A hands-on assessment of a tool or feature.',
  workflow: 'A repeatable, step-by-step tutorial.',
  pulse: 'A synthesis of real community discussion and sentiment, not a single sourced change.',
};

export const EVIDENCE_LEVELS = ['announced', 'researched', 'tested'] as const;
export type Evidence = (typeof EVIDENCE_LEVELS)[number];

export const EVIDENCE_LABELS: Record<Evidence, string> = {
  announced: 'Announced',
  researched: 'Researched',
  tested: 'Tested',
};

export const EVIDENCE_DESCRIPTIONS: Record<Evidence, string> = {
  announced: 'Reported by the maker. Not yet independently checked.',
  researched: 'Checked against sources, but not hands-on tested by us.',
  tested: 'Hands-on tested by our editorial team.',
};

// "Before you use it" fields each open with one of these words (e.g.
// "not verified: ..."). The sidebar turns it into an icon and label; see
// src/lib/check-status.ts and CheckStatus.astro.
export const CHECK_STATUSES = ['known', 'not-verified', 'not-applicable'] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  known: 'Known',
  'not-verified': 'Not verified',
  'not-applicable': 'Not applicable',
};

export const CHECK_STATUS_DESCRIPTIONS: Record<CheckStatus, string> = {
  known: "Confirmed from the maker's own terms or docs, or a reliable source we cite.",
  'not-verified': "We couldn't confirm this. Check it yourself before you rely on it.",
  'not-applicable': "This question doesn't apply to what the article covers.",
};

export const STATUSES = ['draft', 'published', 'withdrawn'] as const;
export type Status = (typeof STATUSES)[number];

// Framed as effort to try, not skill level — a "hard" tool a reader already
// knows is quick for them; the point is how much time this takes to act on.
export const DIFFICULTY_LEVELS = ['quick', 'moderate', 'involved'] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  quick: 'Quick',
  moderate: 'Moderate',
  involved: 'Involved',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  quick: 'Read it and you already have what you need. Nothing to set up or learn.',
  moderate: 'Worth a focused session: some setup, a new interface, or a workflow to get used to.',
  involved: 'A real time investment: new tooling, a multi-step process, or a skill that takes practice.',
};

// Pulse-only: the sidebar's overall-mood read, replacing effort-to-try for a
// format that has nothing to "try".
export const SENTIMENT_LEVELS = ['optimistic', 'mixed', 'skeptical', 'frustrated'] as const;
export type Sentiment = (typeof SENTIMENT_LEVELS)[number];

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  optimistic: 'Optimistic',
  mixed: 'Mixed',
  skeptical: 'Skeptical',
  frustrated: 'Frustrated',
};

// Pulse-only: how much to trust the pattern as real sentiment rather than a
// single loud voice, surfaced in the sidebar instead of buried in prose.
export const PATTERN_STRENGTH_LEVELS = ['emerging', 'established'] as const;
export type PatternStrength = (typeof PATTERN_STRENGTH_LEVELS)[number];

export const PATTERN_STRENGTH_LABELS: Record<PatternStrength, string> = {
  emerging: 'Emerging pattern',
  established: 'Widespread pattern',
};

export const PATTERN_STRENGTH_DESCRIPTIONS: Record<PatternStrength, string> = {
  emerging: 'Just starting to show up in a few places, not yet a broad consensus.',
  established: 'Showing up repeatedly and independently across multiple spaces.',
};
