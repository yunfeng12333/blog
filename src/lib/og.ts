import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../site.config';

/**
 * 分享卡片生成。手写 SVG 而不是用 satori，是因为 satori 的排版逻辑按西文设计，
 * 中文标题的折行反而不如按字符宽度自己算准；也少一个依赖。
 *
 * 字体是 Noto Sans SC 的子集（GB2312 + ASCII，单字重 600，2.1MB），
 * 只在构建时读取，不会进前端产物。子集外的生僻字会显示为空白方块。
 */

// 从项目根解析，不用 import.meta.url——这个模块在构建时会被打包搬走，相对路径会断。
const FONT_PATH = join(process.cwd(), 'src/assets/fonts/og-noto-sc.ttf');

let fontCache: Buffer | null = null;

function loadFont(): Buffer {
  if (fontCache) return fontCache;
  try {
    fontCache = readFileSync(FONT_PATH);
  } catch {
    throw new Error(
      `分享图字体没找到：${FONT_PATH}\n` +
        '这个文件应该在仓库里（约 2.1MB）。如果是 clone 后丢失，检查 .gitignore 或 Git LFS 配置。'
    );
  }
  return fontCache;
}

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING = 80;
const BAR = 14;
const TITLE_SIZE = 56;
const LINE_HEIGHT = 84;
const MAX_LINES = 4;

const CJK = /[⺀-鿿　-〿＀-￯]/;

export interface OgOptions {
  title: string;
  /** 顶部小标，通常是栏目名 */
  eyebrow?: string;
  /** 右下角，通常是日期 */
  footnote?: string;
}

export function renderOgImage({ title, eyebrow, footnote }: OgOptions): Buffer {
  const lines = wrap(title, WIDTH - PADDING * 2 - BAR, TITLE_SIZE);
  // 标题整体垂直居中偏上，给底部信息留出位置
  const blockHeight = lines.length * LINE_HEIGHT;
  const firstBaseline = (HEIGHT - blockHeight) / 2 + TITLE_SIZE * 0.78;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fbfaf7"/>
  <rect width="${BAR}" height="${HEIGHT}" fill="#a23e2e"/>
  ${
    eyebrow
      ? `<text x="${PADDING + BAR}" y="${PADDING + 24}" font-family="Noto Sans SC" font-size="26" fill="#8a8a85">${escape(eyebrow)}</text>`
      : ''
  }
  ${lines
    .map(
      (line, i) =>
        `<text x="${PADDING + BAR}" y="${firstBaseline + i * LINE_HEIGHT}" font-family="Noto Sans SC" font-size="${TITLE_SIZE}" fill="#1a1a1c">${escape(line)}</text>`
    )
    .join('\n  ')}
  <text x="${PADDING + BAR}" y="${HEIGHT - PADDING}" font-family="Noto Sans SC" font-size="28" fill="#62625e">${escape(SITE.title)}</text>
  ${
    footnote
      ? `<text x="${WIDTH - PADDING}" y="${HEIGHT - PADDING}" text-anchor="end" font-family="Noto Sans SC" font-size="26" fill="#8a8a85">${escape(footnote)}</text>`
      : ''
  }
</svg>`;

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: {
      fontBuffers: [loadFont()],
      defaultFontFamily: 'Noto Sans SC',
      loadSystemFonts: false, // 构建机（Linux）不一定有中文字体，禁掉保证结果一致
    },
  });

  return resvg.render().asPng();
}

/** 按字符宽度折行：中文按 1 个字宽算，拉丁字符按 0.55，拉丁单词尽量不拆断 */
function wrap(text: string, maxWidth: number, fontSize: number): string[] {
  const lines: string[] = [];
  let line = '';
  let width = 0;
  let lastSpace = -1;

  for (const char of text) {
    const charWidth = (CJK.test(char) ? 1 : 0.55) * fontSize;

    if (width + charWidth > maxWidth && line) {
      // 断点落在拉丁单词中间时，回退到上一个空格
      if (lastSpace > 0 && !CJK.test(char)) {
        lines.push(line.slice(0, lastSpace));
        line = line.slice(lastSpace + 1) + char;
        width = measure(line, fontSize);
      } else {
        lines.push(line);
        line = char;
        width = charWidth;
      }
      lastSpace = -1;
    } else {
      line += char;
      width += charWidth;
    }

    if (char === ' ') lastSpace = line.length - 1;

    if (lines.length === MAX_LINES) break;
  }

  if (line && lines.length < MAX_LINES) lines.push(line);

  // 超长标题截断并加省略号，而不是让它溢出画布
  if (lines.length === MAX_LINES) {
    const consumed = lines.join('').length;
    if (consumed < text.length) {
      lines[MAX_LINES - 1] = lines[MAX_LINES - 1].replace(/.$/, '…');
    }
  }

  return lines;
}

function measure(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) width += (CJK.test(char) ? 1 : 0.55) * fontSize;
  return width;
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
