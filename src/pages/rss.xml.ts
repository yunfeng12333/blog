import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, postUrl } from '../lib/posts';
import { SITE, getSection } from '../site.config';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    customData: `<language>zh-cn</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: post.data.date,
      link: postUrl(post),
      categories: [getSection(post.data.section).title, ...post.data.tags],
    })),
  });
}
