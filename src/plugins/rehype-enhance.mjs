/**
 * 正文 HTML 增强。手写而不是装 rehype-slug / rehype-autolink-headings /
 * rehype-external-links 三个包，是因为要做的事只有这三件，遍历逻辑十几行。
 * （标题 id 由 Astro 内置生成，这里只负责挂锚点。）
 *
 * 1. h2/h3/h4 末尾加锚点链接，hover 才显形
 * 2. table 包一层 div.table-scroll，长表格在自身容器内横向滚动，不撑破页面
 * 3. 站外链接加 target=_blank + rel=noopener
 */

const HEADINGS = new Set(['h2', 'h3', 'h4']);

export function rehypeEnhance() {
  return (tree) => walk(tree, null, -1);
}

function walk(node, parent, index) {
  if (node.type === 'element') {
    if (HEADINGS.has(node.tagName) && node.properties?.id) {
      addAnchor(node);
    } else if (node.tagName === 'table' && parent) {
      wrapTable(node, parent, index);
      return; // 已被替换，不再往下走
    } else if (node.tagName === 'a') {
      markExternal(node);
    }
  }

  const children = node.children;
  if (!children) return;

  // 倒序遍历：wrapTable 会原地替换节点，倒序可以避免索引错位
  for (let i = children.length - 1; i >= 0; i--) {
    walk(children[i], node, i);
  }
}

function addAnchor(node) {
  node.children.push({
    type: 'element',
    tagName: 'a',
    properties: {
      className: ['anchor'],
      href: `#${node.properties.id}`,
      'aria-label': `链接到本节：${textOf(node)}`,
    },
    children: [{ type: 'text', value: '#' }],
  });
}

function wrapTable(node, parent, index) {
  parent.children[index] = {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['table-scroll'],
      tabindex: '0', // 可滚动区域必须能被键盘聚焦，否则无障碍不达标
      role: 'region',
      'aria-label': '表格，可横向滚动',
    },
    children: [node],
  };
}

function markExternal(node) {
  const href = node.properties?.href;
  if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;
  node.properties.target = '_blank';
  node.properties.rel = 'noopener noreferrer';
}

function textOf(node) {
  if (node.type === 'text') return node.value;
  return (node.children ?? []).map(textOf).join('');
}
