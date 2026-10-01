import type { CheckStatus } from '../config/site';

// Splits a "Before you use it" value like "not verified: the terms don't say"
// into its status and the explanation that follows. A value with no status
// word up front is a plain statement of fact from the sources (e.g. a price),
// so it counts as known.
const PREFIXES: [RegExp, CheckStatus][] = [
  [/^not verified\b/i, 'not-verified'],
  [/^not applicable\b/i, 'not-applicable'],
  [/^known\b/i, 'known'],
];

export function parseCheckStatus(value: string): { status: CheckStatus; text: string } {
  const trimmed = value.trim();
  for (const [pattern, status] of PREFIXES) {
    const match = trimmed.match(pattern);
    if (match) {
      const rest = trimmed.slice(match[0].length).replace(/^[\s:,.;-]+/, '');
      return { status, text: rest.charAt(0).toUpperCase() + rest.slice(1) };
    }
  }
  return { status: 'known', text: trimmed };
}
