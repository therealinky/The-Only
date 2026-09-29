// Central site configuration. Editors change these values, not code.

export const SITE = {
  name: 'The Only',
  descriptor: 'AI Guide for Working Designers',
  description:
    'A practical field guide to AI for working designers: what changed, why it matters, what is worth trying, and what to watch out for.',
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
} as const;

// Weekly digest. No signup form is shown, and no email addresses are
// collected or stored, until both of these are set to real values. See
// NewsletterSignup.astro and the README's Email digest section.
export const NEWSLETTER = {
  provider:
    import.meta.env?.NEWSLETTER_PROVIDER ||
    (typeof process !== 'undefined' ? process.env.NEWSLETTER_PROVIDER : undefined) ||
    null,
  // Buttondown's embeddable subscribe form posts straight to a public,
  // per-account URL — not a secret, but it's still an env var rather than a
  // literal here so the repo doesn't hardcode a specific person's account.
  buttondownUsername:
    import.meta.env?.NEWSLETTER_BUTTONDOWN_USERNAME ||
    (typeof process !== 'undefined' ? process.env.NEWSLETTER_BUTTONDOWN_USERNAME : undefined) ||
    null,
} as const;

export const DISCIPLINES = [
  'Brand',
  'Web',
  'UI/UX',
  'Motion & Video',
  'Illustration',
  '3D',
  'Creative Coding',
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
