import { collection, config, fields } from '@keystatic/core';
import { DIFFICULTY_LEVELS, DISCIPLINES, EVIDENCE_LEVELS, FORMATS, SITE } from './src/config/site';

// Keystatic runs in LOCAL MODE ONLY (storage: 'local'), as an optional
// editing UI at /keystatic during `astro dev`. It is never wired up for
// GitHub mode or Keystatic Cloud, and the integration that serves it is
// only loaded for the dev command (see astro.config.mjs) — so this file,
// and everything it depends on, never ships in a production build.
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
          description: 'Brief: a concise sourced update. Test: a hands-on assessment. Workflow: a repeatable tutorial.',
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
        tools: fields.array(fields.text({ label: 'Tool name' }), {
          label: 'Tools discussed',
          itemLabel: (props) => props.value || 'Tool',
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
          { label: 'Before you use it', description: 'Use "not verified" for anything not checked.' }
        ),
        withdrawnNote: fields.text({
          label: 'Withdrawn note',
          description: 'Required when status is "Withdrawn".',
          multiline: true,
        }),
        content: fields.mdx({ label: 'Content', extension: 'mdx' }),
      },
    }),
  },
});
