/**
 * 站点单点配置。改栏目名、站点信息、导航，只改这个文件。
 * 注意：栏目 key 同时是 URL 路径与 frontmatter 的 section 值，
 * 发布后修改必须在 public/_redirects 里补 301。
 */

export const SITE = {
  /** 生产域名，用于 canonical / OG / sitemap / RSS 绝对地址 */
  url: 'https://zhangyunfeng.com',
  title: '张云峰',
  /** 首页与默认 meta description */
  description: '一个在都柏林的连续创业者，记录移居决策与创业复盘。',
  author: '张云峰',
  lang: 'zh-Hans',
  /** 首页自我介绍，纯文本，两三句 */
  intro:
    '我是张云峰，在都柏林生活了七年，同时经营几家公司。这里写两件事：一家四口找下一个落脚点的真实决策过程，以及一个人管多家公司的经验与教训。',
} as const;

export type SectionKey = 'move' | 'build';

export interface SectionConfig {
  /** URL 路径，同时是 frontmatter 的 section 值 */
  key: SectionKey;
  /** 导航与页面标题 */
  title: string;
  /** 栏目页说明与 meta description */
  description: string;
  /** 是否在文末显示免责声明（移民类内容需要） */
  disclaimer: boolean;
}

export const SECTIONS: SectionConfig[] = [
  {
    key: 'move',
    title: '移民决策',
    description:
      '给正在考虑移居的华人家庭：候选地的教育、税务与生活方式对比，以及我们自己的决策过程。',
    disclaimer: true,
  },
  {
    key: 'build',
    title: '创业复盘',
    description: '一个人管多家公司的经历：项目怎么启动、怎么关停，以及用什么工具和工作流。',
    disclaimer: false,
  },
];

export const SECTION_KEYS = SECTIONS.map((s) => s.key);

export function getSection(key: string): SectionConfig {
  const section = SECTIONS.find((s) => s.key === key);
  if (!section) throw new Error(`未知栏目：${key}`);
  return section;
}

/** 免责声明文案，移民栏目文末固定显示 */
export const DISCLAIMER =
  '本文是个人经历与公开信息的整理，不构成法律、税务或移民建议。政策随时可能变化，请以官方来源为准，重大决定前请咨询有资质的专业人士。';

/**
 * 标签的 URL slug。中文没法直接进 URL，哈希又不可读，所以在这里显式映射。
 * 写文章时用了没登记的标签，构建会失败并提示往这里加一行——
 * 这样标签 URL 永远是可读的，也顺便逼着标签体系保持收敛。
 */
export const TAG_SLUGS: Record<string, string> = {
  香港: 'hong-kong',
  日本: 'japan',
  西班牙: 'spain',
  巴塞罗那: 'barcelona',
  瓦伦西亚: 'valencia',
  爱尔兰: 'ireland',
  教育: 'education',
  税务: 'tax',
  身份: 'residency',
  复盘: 'retrospective',
  决策: 'decision',
  工作流: 'workflow',
  工具: 'tools',
  自动化: 'automation',
};

/** 导航栏链接 */
export const NAV = [
  ...SECTIONS.map((s) => ({ href: `/${s.key}/`, label: s.title })),
  { href: '/archive/', label: '归档' },
  { href: '/about/', label: '关于' },
];
