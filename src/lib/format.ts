const CJK = /[㐀-鿿豈-﫿぀-ヿ]/g;
const LATIN_WORD = /[A-Za-z0-9]+(?:[''-][A-Za-z0-9]+)*/g;

/** 中文阅读速度约 400 字/分，英文约 220 词/分 */
export function readingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '') // 代码块不计入
    .replace(/`[^`\n]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // 链接保留文字

  const cjk = text.match(CJK)?.length ?? 0;
  const latin = text.match(LATIN_WORD)?.length ?? 0;

  return Math.max(1, Math.round(cjk / 400 + latin / 220));
}

/** 2026-09-21 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 2026 年 9 月 21 日 */
export function formatDateCN(date: Date): string {
  return `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月 ${date.getUTCDate()} 日`;
}

/** RFC 3339，用于 <time datetime> 与 JSON-LD */
export function isoDate(date: Date): string {
  return date.toISOString();
}
