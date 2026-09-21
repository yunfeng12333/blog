# 部署到 Cloudflare Pages

一次性设置，之后 `git push` 就会自动构建上线。

## 1. 建 Pages 项目

Cloudflare 控制台 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**，选这个仓库（私有仓库也可以，授权后能读到）。

构建设置：

| 项 | 值 |
| --- | --- |
| Framework preset | `Astro`（或 None，下面的值一样） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 留空 |

环境变量加一条，否则构建机可能用老版本 Node：

| 变量名 | 值 |
| --- | --- |
| `NODE_VERSION` | `22` |

> 本地开发用的是 Node 26.3.0，构建在 22 和 26 上都能过。`sharp` 和 `@resvg/resvg-js` 在 Cloudflare 的 Linux 构建机上走预编译二进制，不需要额外配置。

第一次部署完会给一个 `xxx.pages.dev` 地址，先用它验证站点正常。

## 2. 绑定域名

域名建议在 **Cloudflare Registrar** 注册（成本价无溢价，和 Pages 同一个控制台，省掉改 NS 的步骤）。

Pages 项目 → **Custom domains** → **Set up a custom domain** → 填 `zhangyunfeng.com`，再加一个 `www` 的话让它 301 到主域名，别两个地址都能访问正文（会分散 SEO 权重）。

域名定下来之后，要同步改三个地方：

1. `src/site.config.ts` 的 `SITE.url`
2. `public/robots.txt` 里的 `Sitemap:` 那一行
3. Cloudflare 的自定义域名设置

这三处不一致会导致 canonical 和 sitemap 指向错误的地址。

## 3. 统计

用 Cloudflare Web Analytics，**在控制台开自动注入，不要往代码里贴 beacon 脚本**。

Pages 项目 → **Settings** → **Web Analytics** → 开启。

这样做的原因：站点有一条硬约束是「首屏不依赖任何外部请求即可完整渲染」。控制台注入的 beacon 是异步的，被拦截或加载失败都不影响页面，而写进源码就等于在仓库里留了一个外部脚本依赖。

> 注意：大陆访问者的 beacon 大概率发不出去（`cloudflareinsights.com` 不稳），统计数字会少算这部分人。页面本身不受影响。

## 4. 重定向

`public/_redirects` 会被原样复制到 `dist/`，Cloudflare Pages 自动识别。

文章 URL 发布后不改；万一必须改，在那个文件里加 301，别直接删旧地址。

短链（`/p/<短码>/`）不走 `_redirects`，是构建生成的静态跳转页——这样换托管商也不会失效。

## 5. 关于国内访问

**Cloudflare 免费版在中国大陆是间歇性不可达的**，自定义域名也改变不了这一点。

当前的取舍：博客面向海外和能翻墙的读者，国内读者靠小红书承接，博客放完整版供搜索和长期沉淀。

代码层面的约束一条没松（不引 Google 字体、不引公共 CDN、不嵌 YouTube、依赖全部打包进站点），所以将来如果要做国内镜像，直接把 `dist/` 丢到国内节点就能用，不需要改代码。

真要做大陆直连是另一个项目：需要备案 + 国内 CDN，而且移民、税务类内容备案有内容风险，建议先评估再动。

## 6. 上线后要做的

- [ ] Google Search Console 提交 `https://<域名>/sitemap-index.xml`
- [ ] 用微信、Telegram 各发一次文章链接，确认分享卡片的标题和封面正常
- [ ] 在 RSS 阅读器里订阅 `/rss.xml` 确认能拉到
- [ ] 确认 `https://<域名>/p/<某篇的短码>/` 能正确跳转（短码在文章页底部）
