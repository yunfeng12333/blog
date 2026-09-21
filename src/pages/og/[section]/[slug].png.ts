import type { APIContext } from 'astro';
import { getPosts, type Post } from '../../../lib/posts';
import { renderOgImage } from '../../../lib/og';
import { formatDate } from '../../../lib/format';
import { getSection } from '../../../site.config';

export async function getStaticPaths() {
  const posts = await getPosts();
  return posts.map((post) => ({
    params: { section: post.data.section, slug: post.data.slug },
    props: { post },
  }));
}

export function GET({ props }: APIContext) {
  const { post } = props as { post: Post };

  const png = renderOgImage({
    title: post.data.title,
    eyebrow: getSection(post.data.section).title,
    footnote: formatDate(post.data.updated ?? post.data.date),
  });

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
}
