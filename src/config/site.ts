// Central site configuration. Editors change these values, not code.

export const SITE = {
  name: 'The Only',
  descriptor: 'AI for Working Designers',
  description:
    'A practical field guide to AI for working designers: what changed, why it matters, what is worth trying, and what to watch out for.',
  url:
    import.meta.env?.SITE_URL ||
    (typeof process !== 'undefined' ? process.env.SITE_URL : undefined) ||
    'http://localhost:4321',
  defaultAuthor: 'Ana M. Rivas',
  // Intentionally NOT the real editor name — content.config.ts treats a
  // published article whose reviewedBy still equals this placeholder as
  // "not actually reviewed yet" and fails the build. See the README.
  defaultReviewedBy: 'Editor name (set in config)',
} as const;

// Weekly digest — intentionally not built. No signup form is shown, and no
// email addresses are collected or stored, until this is set to a real
// provider name. See NewsletterSignup.astro and the README for what wiring
// a provider up would involve.
export const NEWSLETTER = {
  provider:
    import.meta.env?.NEWSLETTER_PROVIDER ||
    (typeof process !== 'undefined' ? process.env.NEWSLETTER_PROVIDER : undefined) ||
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

export const FORMATS = ['brief', 'test', 'workflow'] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_LABELS: Record<Format, string> = {
  brief: 'Brief',
  test: 'Test',
  workflow: 'Workflow',
};

export const FORMAT_DESCRIPTIONS: Record<Format, string> = {
  brief: 'A concise, sourced update on something that changed.',
  test: 'A hands-on assessment of a tool or feature.',
  workflow: 'A repeatable, step-by-step tutorial.',
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
