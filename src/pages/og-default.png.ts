import { renderOgImage } from '../lib/og';
import { SITE } from '../site.config';

/** 首页、栏目页、归档等没有封面的页面共用这张分享图 */
export function GET() {
  const png = renderOgImage({
    title: SITE.description,
    eyebrow: SITE.url.replace(/^https?:\/\//, ''),
  });

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
}
