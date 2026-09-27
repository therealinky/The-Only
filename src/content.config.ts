import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { DISCIPLINES, EVIDENCE_LEVELS, FORMATS, SITE, STATUSES } from './config/site';

const sourceSchema = z.object({
  title: z.string().min(1, 'Source title is required.'),
  url: z.string().url('Source url must be a valid URL.'),
  accessed: z.coerce.date(),
});

const summarySchema = z.object({
  whatChanged: z.string(),
  whyItMatters: z.string(),
  bestFor: z.string(),
  timeToTry: z.string(),
});

const beforeYouUseSchema = z.object({
  clientData: z.string().min(1, '"beforeYouUse.clientData" is required (use "not verified" if unchecked).'),
  usageRights: z.string().min(1, '"beforeYouUse.usageRights" is required (use "not verified" if unchecked).'),
  disclosure: z.string().min(1, '"beforeYouUse.disclosure" is required (use "not verified" if unchecked).'),
  accessibility: z.string().min(1, '"beforeYouUse.accessibility" is required (use "not verified" if unchecked).'),
  cost: z.string().min(1, '"beforeYouUse.cost" is required (use "not verified" if unchecked).'),
});

const articleSchema = z
  .object({
    title: z.string().min(1),
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase and dash-separated (e.g. "my-article-slug").'),
    dek: z.string().min(1, 'dek (one-sentence summary) is required.'),
    format: z.enum(FORMATS),
    evidence: z.enum(EVIDENCE_LEVELS),
    status: z.enum(STATUSES),
    example: z.boolean().default(false),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    lastVerified: z.coerce.date(),
    author: z.string().min(1).default(SITE.defaultAuthor),
    reviewedBy: z.string().min(1).default(SITE.defaultReviewedBy),
    disciplines: z.array(z.enum(DISCIPLINES)).min(1, 'At least one discipline is required.'),
    tools: z.array(z.string().min(1)).default([]),
    sources: z.array(sourceSchema).default([]),
    summary: summarySchema.optional(),
    beforeYouUse: beforeYouUseSchema,
    withdrawnNote: z.string().min(1).optional(),
  })
  // --- Build rules enforced here (not just in documentation) ---
  .superRefine((data, ctx) => {
    const id = `"${data.slug}"`;

    if (data.evidence === 'tested' && data.format === 'brief') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['evidence'],
        message: `${id}: evidence "tested" requires format "test" or "workflow", not "brief".`,
      });
    }

    const needsSummary = data.format === 'test' || data.format === 'workflow';
    const summaryComplete =
      !!data.summary &&
      data.summary.whatChanged.trim() !== '' &&
      data.summary.whyItMatters.trim() !== '' &&
      data.summary.bestFor.trim() !== '' &&
      data.summary.timeToTry.trim() !== '';

    if (needsSummary && !summaryComplete) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: `${id}: format "${data.format}" requires a complete summary (whatChanged, whyItMatters, bestFor, timeToTry).`,
      });
    }

    if (data.status === 'withdrawn' && !data.withdrawnNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['withdrawnNote'],
        message: `${id}: status "withdrawn" requires a withdrawnNote explaining the withdrawal.`,
      });
    }

    if (data.status === 'published') {
      if (!data.reviewedBy || data.reviewedBy === SITE.defaultReviewedBy) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reviewedBy'],
          message: `${id}: status "published" requires a real reviewedBy value, not the "${SITE.defaultReviewedBy}" placeholder.`,
        });
      }
      if (data.sources.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sources'],
          message: `${id}: status "published" requires at least one source.`,
        });
      }
      if (needsSummary && !summaryComplete) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['summary'],
          message: `${id}: status "published" ${data.format} articles require a complete summary.`,
        });
      }
    }
  });

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: articleSchema,
});

export const collections = { articles };
