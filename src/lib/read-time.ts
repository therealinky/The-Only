const WORDS_PER_MINUTE = 200;

// Rough plain-text word count from MDX source: strips the syntax that would
// otherwise inflate or skew the count (code fences, markdown links/images,
// heading/emphasis markers) without needing a full markdown parser, this is
// an estimate for a "X min read" label, not an exact figure.
export function getReadingTime(body: string): number {
  const plainText = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ');

  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
