import { getCollection, type CollectionEntry } from 'astro:content';
import { createHash } from 'node:crypto';
import { SECTION_KEYS, TAG_SLUGS, type SectionKey } from '../site.config';

export type Post = CollectionEntry<'posts'>;

/**
 * 草稿：生产构建里完全剔除（不出页面、不进 sitemap、不进搜索索引）；
 * 本地 dev 保留，方便边写边看。
 */
const INCLUDE_DRAFTS = import.meta.env.DEV;

let cache: Post[] | null = null;

/** 全部已发布文章，按日期倒序（同日按标题稳定排序） */
export async function getPosts(): Promise<Post[]> {
  if (cache) return cache;

  const all = await getCollection('posts');
  validate(all);

  cache = all
    .filter((p) => INCLUDE_DRAFTS || !p.data.draft)
    .sort((a, b) => {
      const diff = b.data.date.getTime() - a.data.date.getTime();
      return diff !== 0 ? diff : a.data.title.localeCompare(b.data.title, 'zh-Hans');
    });

  return cache;
}

export async function getPostsBySection(section: SectionKey): Promise<Post[]> {
  return (await getPosts()).filter((p) => p.data.section === section);
}

/** 同系列文章，按 seriesOrder 升序 */
export async function getSeriesPosts(series: string): Promise<Post[]> {
  return (await getPosts())
    .filter((p) => p.data.series === series)
    .sort((a, b) => (a.data.seriesOrder ?? 0) - (b.data.seriesOrder ?? 0));
}

/** 全部系列 slug */
export async function getAllSeries(): Promise<string[]> {
  const posts = await getPosts();
  return [...new Set(posts.map((p) => p.data.series).filter(Boolean))] as string[];
}

/** 全部标签及其文章数，按文章数倒序 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const post of await getPosts()) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-Hans'));
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  return (await getPosts()).filter((p) => p.data.tags.includes(tag));
}

/**
 * 标签的 URL slug。纯 ASCII 标签直接规范化，中文标签查 TAG_SLUGS 映射表。
 * 查不到会在构建校验时报错，不会悄悄退化成一串哈希。
 */
export function tagToSlug(tag: string): string {
  const ascii = tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return ascii || TAG_SLUGS[tag] || '';
}

/** 文章正文 URL */
export function postUrl(post: Post): string {
  return `/${post.data.section}/${post.data.slug}/`;
}

/**
 * 短链码：默认由 section+slug 派生，稳定且零维护。
 * frontmatter 里写了 shortId 就用作者指定的。
 */
export function shortId(post: Post): string {
  return post.data.shortId ?? hash(`${post.data.section}/${post.data.slug}`).slice(0, 6);
}

export function shortUrl(post: Post): string {
  return `/p/${shortId(post)}/`;
}

function hash(input: string): string {
  // base36 比 hex 短，6 位约 20 亿种组合，个人博客量级不可能撞
  return BigInt('0x' + createHash('sha1').update(input).digest('hex').slice(0, 16)).toString(36);
}

/**
 * 构建期一致性校验。这些问题在运行时表现为“链接莫名其妙指错文章”，
 * 很难查，所以一律在构建时炸掉。
 */
function validate(posts: Post[]): void {
  const errors: string[] = [];
  const urls = new Map<string, string>();
  const codes = new Map<string, string>();
  const tagSlugs = new Map<string, string>();

  for (const post of posts) {
    const where = post.filePath ?? post.id;

    for (const tag of post.data.tags) {
      const slug = tagToSlug(tag);
      if (!slug) {
        errors.push(
          `${where}：标签「${tag}」没有 URL slug，到 src/site.config.ts 的 TAG_SLUGS 里加一行，例如 '${tag}': 'your-slug'`
        );
        continue;
      }
      const owner = tagSlugs.get(slug);
      if (owner && owner !== tag) {
        errors.push(`标签「${tag}」和「${owner}」的 slug 都是 ${slug}，TAG_SLUGS 里改掉其中一个`);
      } else {
        tagSlugs.set(slug, tag);
      }
    }

    // 目录必须和 section 对应，否则文件放在 move/ 里却出现在 build/ 栏目下
    const dir = post.id.split('/')[0];
    if (SECTION_KEYS.includes(dir) && dir !== post.data.section) {
      errors.push(`${where}：文件在 ${dir}/ 目录下，frontmatter 的 section 却是 ${post.data.section}`);
    }

    const url = `/${post.data.section}/${post.data.slug}/`;
    const clash = urls.get(url);
    if (clash) errors.push(`${where}：URL ${url} 与 ${clash} 重复，slug 必须在栏目内唯一`);
    else urls.set(url, where);

    const code = post.data.shortId ?? hash(`${post.data.section}/${post.data.slug}`).slice(0, 6);
    const codeClash = codes.get(code);
    if (codeClash) errors.push(`${where}：短链码 ${code} 与 ${codeClash} 冲突，给其中一篇手写 shortId`);
    else codes.set(code, where);
  }

  if (errors.length) {
    throw new Error(`内容校验未通过：\n  - ${errors.join('\n  - ')}`);
  }
}
