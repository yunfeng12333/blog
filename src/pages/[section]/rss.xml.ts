import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPostsBySection, postUrl } from '../../lib/posts';
import { SITE, SECTIONS, getSection, type SectionKey } from '../../site.config';

export function getStaticPaths() {
  return SECTIONS.map((section) => ({ params: { section: section.key } }));
}

export async function GET(context: APIContext) {
  const key = context.params.section as SectionKey;
  const section = getSection(key);
  const posts = await getPostsBySection(key);

  return rss({
    title: `${section.title} · ${SITE.title}`,
    description: section.description,
    site: context.site ?? SITE.url,
    customData: `<language>zh-cn</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: postUrl(post),
      categories: post.data.tags,
    })),
  });
}
