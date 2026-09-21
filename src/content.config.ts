import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { SECTION_KEYS } from './site.config';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1, '标题不能为空'),
      slug: z
        .string()
        .regex(SLUG_RE, 'slug 只能用小写英文/数字和连字符，不要用中文或大写'),
      section: z.enum(SECTION_KEYS as [string, ...string[]]),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      summary: z.string().min(1, '摘要不能为空').max(120, '摘要不要超过 120 字'),
      tags: z.array(z.string()).default([]),
      series: z.string().regex(SLUG_RE, 'series 用小写英文加连字符').optional(),
      seriesOrder: z.number().int().positive().optional(),
      cover: image().optional(),
      draft: z.boolean().default(false),
      /** 涉及政策/税率时填，正文顶部显示「信息截至某日」 */
      policyAsOf: z.coerce.date().optional(),
      /** 对应小红书精简版链接 */
      xhsUrl: z.string().url('xhsUrl 必须是完整 URL').optional(),
      /** 短链码，留空则由 slug 自动派生，一般不用手写 */
      shortId: z
        .string()
        .regex(/^[a-z0-9]{4,12}$/, '短链码用 4-12 位小写字母或数字')
        .optional(),
    })
    .refine((d) => !d.series || typeof d.seriesOrder === 'number', {
      message: '文章填了 series 就必须填 seriesOrder，否则系列内顺序无法确定',
      path: ['seriesOrder'],
    }),
});

export const collections = { posts };
