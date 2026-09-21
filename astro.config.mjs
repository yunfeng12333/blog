// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
// Astro 7 默认的 Markdown 处理器是 Sätteri，它的插件 API 是 Rust 命令式的，
// 跑不了 remark-pangu 这类 unist 插件。显式切回 unified 管线。
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark';
import { remarkCjkSpacing } from './src/plugins/remark-cjk-spacing.mjs';
import { rehypeEnhance } from './src/plugins/rehype-enhance.mjs';
import { SITE } from './src/site.config.ts';

export default defineConfig({
  site: SITE.url,
  // 信息架构里的 URL 都带尾斜杠（/move/），保持一致避免重定向和 canonical 分裂
  trailingSlash: 'always',

  markdown: {
    processor: unified({
      // 中英混排自动加空格；只动 text 节点，代码块和行内代码不受影响
      remarkPlugins: [remarkCjkSpacing],
      // Astro 默认在用户插件之后才生成标题 id，锚点插件会读不到。
      // 显式把它排在前面。
      rehypePlugins: [rehypeHeadingIds, rehypeEnhance],
      // 表格、删除线等要靠 GFM
      gfm: true,
      // 关掉智能标点：中文引号和破折号保持作者原文，不做全角/半角自动转换
      smartypants: false,
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },

  integrations: [
    sitemap({
      // 短链只是跳板，不该被索引
      filter: (page) => !page.includes('/p/'),
    }),
  ],

  build: {
    // 每篇文章一个目录 + index.html，配合 trailingSlash: 'always'
    format: 'directory',
  },

  // 构建期压缩图片并输出 WebP，不依赖任何外部图片服务
  image: {
    responsiveStyles: true,
  },
});
