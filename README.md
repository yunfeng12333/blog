# 个人博客

中文个人博客，两个栏目：**移民决策**（`/move/`）和**创业复盘**（`/build/`）。

写 Markdown，`git push`，自动构建上线。纯静态，零后端。

---

## 快速开始

```bash
npm install
npm run dev        # http://localhost:4321
```

发第一篇文章，三步：

```bash
cp templates/new-post.md src/content/move/my-first-post.md
# 编辑：填 title / slug / date / summary，写正文
git add . && git commit -m "第一篇" && git push
```

push 之后 Cloudflare Pages 自动构建部署，约一分钟。部署设置见 [docs/deploy-cloudflare.md](docs/deploy-cloudflare.md)。

## 命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发，改文件自动刷新。**草稿在这里可见** |
| `npm run build` | 构建到 `dist/` 并生成搜索索引。草稿不会被构建 |
| `npm run preview` | 预览构建产物，和线上一致 |
| `npm run clean` | 清掉所有缓存，改了 Markdown 插件后必须跑（见下方「坑」） |

## 写文章

文章是 `src/content/move/` 或 `src/content/build/` 下的 `.md` 文件，文件名随意，URL 由 frontmatter 的 `slug` 决定。

模板在 `templates/new-post.md`，里面写全了每个字段的含义。

必填字段缺了会**构建失败**，并明确告诉你缺哪个、在哪个文件。

### 几条硬规矩

- **`slug` 发布后不要改。** 真要改，必须在 `public/_redirects` 里加一条 301，别让旧链接死掉。
- **新标签要先登记。** 中文标签没法直接进 URL，在 `src/site.config.ts` 的 `TAG_SLUGS` 里加一行映射，否则构建失败。这个限制是有意的，能顺便逼着标签体系保持收敛。
- **`section` 必须和所在目录一致**，否则构建失败。
- **政策类文章填 `policyAsOf`**，正文顶部会自动显示「信息截至某日」提示条。
- **草稿用 `draft: true`**，本地能预览，绝不会被构建和部署。

### 中文排版

构建时会自动在**中文和英文/数字之间**加空格，不用手打：

```
我用Astro搭建blog     →    我用 Astro 搭建 blog
```

标点**不会**被动。你写中文引号「“”」就是中文引号，写破折号「——」就是破折号，不会被加空格也不会被转成半角。代码块和行内代码完全不受影响。

正文排版：17–18px、行高 1.8、宽度约 40 个汉字。要调的话改 `src/styles/prose.css`，这是全站最值得反复调的文件。

## 改栏目名

栏目的 URL 路径、显示名、描述都在 `src/site.config.ts` 的 `SECTIONS` 里，改一处全站生效。

但改了之后：

1. 已有文章 frontmatter 的 `section` 值要一起改（构建会报错提醒你）
2. 旧 URL 要在 `public/_redirects` 里加整段 301：`/move/*  /新路径/:splat  301`

## 加依赖

每加一个 npm 包，在下面这张表里补一行说明原因。目前是 7 个：

| 依赖 | 为什么需要 |
| --- | --- |
| `astro` | 框架本体 |
| `@astrojs/markdown-remark` | Astro 7 默认的 Markdown 处理器是 Sätteri，插件 API 是 Rust 命令式的，跑不了 unist 插件。装这个切回 unified 管线 |
| `@astrojs/sitemap` | 生成 `sitemap-index.xml` |
| `@astrojs/rss` | 全站和分栏目 RSS |
| `pagefind` | 站内搜索，构建时生成静态索引，无后端 |
| `sharp` | 构建时压缩图片、输出 WebP |
| `@resvg/resvg-js` | 把分享卡片的 SVG 栅格化成 PNG |

中英混排加空格、标题锚点、表格横向滚动容器、外链标记，都是 `src/plugins/` 下自己写的，各几十行，没引包。

`src/assets/fonts/og-noto-sc.ttf`（2.1MB）是 Noto Sans SC 的子集（GB2312 + ASCII，单字重），只在构建时用来渲染分享图，不会下发给读者。

## 目录结构

```
src/
├── site.config.ts          站点信息、栏目定义、标签 slug 映射 —— 改配置先看这里
├── content.config.ts       frontmatter 的 schema，缺字段就构建失败
├── content/
│   ├── move/               移民决策的文章
│   └── build/              创业复盘的文章
├── layouts/BaseLayout.astro  所有页面的外壳：SEO meta、OG、JSON-LD、主题
├── components/             目录、系列导航、政策提示、免责声明、搜索、主题切换
├── pages/                  路由
├── lib/                    文章查询、构建期校验、短链、阅读时长、分享图
├── plugins/                自己写的 remark / rehype 插件
├── styles/                 tokens.css（配色）/ prose.css（正文）/ global.css
└── assets/fonts/           分享图用的中文字体子集
public/                     robots.txt、favicon、_redirects
templates/new-post.md       新文章模板
```

## 坑

**改了 Markdown 插件或排版规则，输出却没变** —— Astro 把渲染好的 HTML 缓存在 `node_modules/.astro/data-store.json`，源文件没变就不会重渲染。跑 `npm run clean` 再构建。（只删项目根的 `.astro/` 不够。）

**标题锚点失效** —— Astro 默认在用户 rehype 插件之后才生成标题 id。`astro.config.mjs` 里 `rehypeHeadingIds` 必须排在 `rehypeEnhance` 前面。

**CSS 段间距莫名消失** —— `.prose p {}` 的特异性是 (0,1,1)，会压过 `.prose > * + *` 的 (0,1,0)。给正文元素设样式时别用标签选择器覆盖外边距，注释里有说明。

## 写作的内容边界

不写，也别让 AI 帮忙起草：

- 进行中的股东纠纷、合伙人矛盾的具体细节和当事人身份
- 公司具体营收、利润、账户、合同金额
- 孩子的真实姓名、学校名、照片里可识别的面部
- 家庭住址、常去地点

匿名化后可以写：合作方、员工、客户用角色代称（「西班牙的运营合伙人」）；已停掉项目的复盘写判断过程和教训，不写对具体人的评价。

涉及税率、签证条件、政策数字时，附官方来源链接；没核实的直接写「待核实」，不要编一个看起来很确定的数字。一篇在搜索引擎里挂两年的文章给出过时数字，危害比没有这篇文章更大。

**仓库保持私有。**

## 二期

架构上已经留好位置，一期不做：

- 邮件订阅（Buttondown 或自托管 Listmonk）—— 页脚和关于页已有占位文案
- 评论系统 —— 要先考虑国内可访问性
- 英文版 `/en/` —— 没做任何预留，Astro 后加 i18n 不难，提前抽象只会让代码变丑
- 候选地对比的交互式筛选表格
