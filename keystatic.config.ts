import { collection, config, fields } from '@keystatic/core';
import { block } from '@keystatic/core/content-components';
import {
  DIFFICULTY_LEVELS,
  DISCIPLINES,
  EVIDENCE_LEVELS,
  FORMATS,
  PATTERN_STRENGTH_LABELS,
  PATTERN_STRENGTH_LEVELS,
  SENTIMENT_LABELS,
  SENTIMENT_LEVELS,
  SITE,
} from './src/config/site';
import { ART_MOTIFS } from './src/lib/hypergraphy';

// Keystatic runs in LOCAL MODE ONLY (storage: 'local'), as an optional
// editing UI at /keystatic during `astro dev`. It is never wired up for
// GitHub mode or Keystatic Cloud, and the integration that serves it is
// only loaded for the dev command (see astro.config.mjs) — so this file,
// and everything it depends on, never ships in a production build.
// Keystatic stores each article's media in its own folder,
// src/assets/articles/<slug>/, and writes that full path into the block.
// Media.astro resolves it and optimizes images at build time.
// Uploaded filenames are cleaned into lowercase-and-hyphens: a Mac
// screenshot name ("Screenshot 2026-10-03 at 3.43.41 PM.png") carries spaces
// and an invisible narrow no-break space, which make for fragile URLs.
function cleanFilename(original: string): string {
  const dot = original.lastIndexOf('.');
  const base = dot > 0 ? original.slice(0, dot) : original;
  const extension = dot > 0 ? original.slice(dot + 1).toLowerCase() : '';
  const slug =
    base
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'media';
  return extension ? `${slug}.${extension}` : slug;
}

const mediaAsset = {
  directory: 'src/assets/articles',
  publicPath: '/src/assets/articles/',
  transformFilename: cleanFilename,
};

// The "Media" block for article bodies, usually inserted at the end of a
// section. Rendered by src/components/Media.astro, which checks the fields
// at build time (e.g. a missing file or alt text fails the build).
const mediaBlock = block({
  label: 'Media',
  description: 'An image, GIF, YouTube video, or Lottie animation, with optional caption and credit.',
  schema: {
    type: fields.select({
      label: 'Type',
      options: [
        { label: 'Image (PNG, JPG, WEBP)', value: 'image' },
        { label: 'GIF', value: 'gif' },
        { label: 'YouTube video', value: 'youtube' },
        { label: 'Lottie or dotLottie animation', value: 'lottie' },
      ],
      defaultValue: 'image',
    }),
    image: fields.image({
      label: 'Image or GIF file',
      description: 'For the Image and GIF types. Saved to this article\'s own media folder.',
      ...mediaAsset,
    }),
    file: fields.file({
      label: 'Lottie file (.json or .lottie)',
      description: 'For the Lottie type.',
      ...mediaAsset,
    }),
    youtube: fields.url({
      label: 'YouTube link',
      description: 'For the YouTube type. Any normal video link works (watch, youtu.be, shorts).',
    }),
    alt: fields.text({
      label: 'Alt text (or video title)',
      description:
        'Required. Describe what the image or animation shows for people who can\'t see it. For YouTube, the video\'s title.',
      validation: { length: { min: 1 } },
    }),
    caption: fields.text({ label: 'Caption', description: 'Optional, shown under the media.', multiline: true }),
    credit: fields.text({
      label: 'Credit',
      description: 'Optional, e.g. "Image: Figma". Use it whenever the media comes from someone else.',
    }),
  },
});

export default config({
  storage: { kind: 'local' },
  collections: {
    articles: collection({
      label: 'Articles',
      path: 'src/content/articles/*',
      // Keystatic treats whichever field is named here as the entry's
      // filename/identity and strips it out of the saved frontmatter by
      // design (the filename already encodes it — that's the point, not a
      // bug). content.config.ts no longer expects a `slug` frontmatter
      // field for exactly this reason; the article's `id` (filename-derived)
      // is the canonical identifier everywhere on the site.
      slugField: 'slug',
      format: { contentField: 'content' },
      schema: {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        slug: fields.text({
          label: 'Slug',
          description: 'Lowercase, dash-separated. Used in the article URL.',
          validation: {
            isRequired: true,
            pattern: {
              regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: 'Must be lowercase and dash-separated, e.g. "my-article-slug".',
            },
          },
        }),
        dek: fields.text({
          label: 'Dek',
          description: 'One-sentence summary shown on cards and at the top of the article.',
          multiline: true,
          validation: { isRequired: true },
        }),
        format: fields.select({
          label: 'Format',
          description:
            'Brief: a concise sourced update. Test: a hands-on assessment. Workflow: a repeatable tutorial. Pulse: a synthesis of real community discussion and sentiment.',
          options: FORMATS.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })),
          defaultValue: 'brief',
        }),
        evidence: fields.select({
          label: 'Evidence',
          description: 'Announced: reported by the maker. Researched: checked against sources. Tested: hands-on tested by us.',
          options: EVIDENCE_LEVELS.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })),
          defaultValue: 'announced',
        }),
        difficulty: fields.select({
          label: 'Difficulty (effort to try)',
          description: 'Quick: nothing to set up. Moderate: a focused session. Involved: a real time investment.',
          options: DIFFICULTY_LEVELS.map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value })),
          defaultValue: 'quick',
        }),
        sentiment: fields.select({
          label: 'Sentiment (Pulse only)',
          description: 'The sidebar\'s overall-mood read. Only used by, and required for, format "Pulse".',
          options: [
            { label: 'Not set', value: '' },
            ...SENTIMENT_LEVELS.map((value) => ({ label: SENTIMENT_LABELS[value], value })),
          ],
          defaultValue: '',
        }),
        patternStrength: fields.select({
          label: 'Pattern strength (Pulse only)',
          description:
            'How solid the sentiment pattern is. Only used by, and required for, format "Pulse".',
          options: [
            { label: 'Not set', value: '' },
            ...PATTERN_STRENGTH_LEVELS.map((value) => ({ label: PATTERN_STRENGTH_LABELS[value], value })),
          ],
          defaultValue: '',
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
            { label: 'Withdrawn', value: 'withdrawn' },
          ],
          defaultValue: 'draft',
        }),
        example: fields.checkbox({
          label: 'Example article',
          description: 'Development placeholder — shows a visible banner and is excluded from production builds.',
          defaultValue: false,
        }),
        publishedAt: fields.date({ label: 'Published at', defaultValue: { kind: 'today' } }),
        updatedAt: fields.date({ label: 'Updated at', defaultValue: { kind: 'today' } }),
        lastVerified: fields.date({ label: 'Last verified', defaultValue: { kind: 'today' } }),
        author: fields.text({
          label: 'Author',
          description: 'The house byline for AI-drafted articles. Leave as the default; set `reviewedBy` to the real human instead.',
          defaultValue: SITE.defaultAuthor,
        }),
        reviewedBy: fields.text({
          label: 'Reviewed by',
          description: `Required (and must not be the "${SITE.defaultReviewedBy}" placeholder) before this article can be published.`,
          defaultValue: SITE.defaultReviewedBy,
        }),
        disciplines: fields.multiselect({
          label: 'Disciplines',
          options: DISCIPLINES.map((value) => ({ label: value, value })),
        }),
        art: fields.select({
          label: 'Article art',
          description:
            'The motif for this article\'s illustration. It must relate to the article and not be used by any other article (the build fails on a repeat). See the daily-articles skill for what each motif means.',
          options: ART_MOTIFS.map((value) => ({ label: value, value })),
          defaultValue: 'browser',
        }),
        tools: fields.array(fields.text({ label: 'Tool name' }), {
          label: 'Tools discussed',
          itemLabel: (props) => props.value || 'Tool',
        }),
        communities: fields.array(fields.text({ label: 'Community/platform name' }), {
          label: 'Communities (Pulse only)',
          description: 'Where this discussion is happening (e.g. "Reddit", "Designer Twitter/X"). Required for format "Pulse".',
          itemLabel: (props) => props.value || 'Community',
        }),
        sources: fields.array(
          fields.object({
            title: fields.text({ label: 'Source title', validation: { isRequired: true } }),
            url: fields.url({ label: 'Source URL', validation: { isRequired: true } }),
            accessed: fields.date({ label: 'Accessed', defaultValue: { kind: 'today' } }),
          }),
          {
            label: 'Sources',
            description: 'Required before this article can be published.',
            itemLabel: (props) => props.fields.title.value || 'Source',
          }
        ),
        summary: fields.object(
          {
            whatChanged: fields.text({ label: 'What changed', multiline: true }),
            whyItMatters: fields.text({ label: 'Why it matters', multiline: true }),
            bestFor: fields.text({ label: 'Best for', multiline: true }),
            timeToTry: fields.text({ label: 'Time to try' }),
          },
          { label: 'Summary', description: 'Required for Test and Workflow formats.' }
        ),
        beforeYouUse: fields.object(
          {
            clientData: fields.text({ label: 'Client data', multiline: true, defaultValue: 'not verified' }),
            usageRights: fields.text({ label: 'Usage rights', multiline: true, defaultValue: 'not verified' }),
            disclosure: fields.text({ label: 'Disclosure', multiline: true, defaultValue: 'not verified' }),
            accessibility: fields.text({ label: 'Accessibility', multiline: true, defaultValue: 'not verified' }),
            cost: fields.text({ label: 'Cost', multiline: true, defaultValue: 'not verified' }),
          },
          { label: 'Before you use it', description: 'Start each field with "known:", "not verified:", or "not applicable:". The sidebar shows it as an icon and label.' }
        ),
        withdrawnNote: fields.text({
          label: 'Withdrawn note',
          description: 'Required when status is "Withdrawn".',
          multiline: true,
        }),
        content: fields.mdx({ label: 'Content', extension: 'mdx', components: { Media: mediaBlock } }),
      },
    }),
  },
});
