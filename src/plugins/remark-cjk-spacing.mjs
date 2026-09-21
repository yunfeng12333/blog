/**
 * 中英混排自动加空格。
 *
 * 本来用的是 remark-pangu，但它把中文弯引号“”当西文符号，会在引号两侧插空格，
 * 中文排版里是错的。规则其实很窄，自己写反而更可控，也少一个依赖：
 *
 *   只在「中日文字」和「拉丁字母或数字」相邻时插一个空格，标点一律不碰。
 *
 * 只处理 mdast 的 text 节点，所以行内代码（inlineCode）和代码块（code）
 * 天然不受影响——它们是不同的节点类型。
 */

// 汉字、假名、扩展区。特意不含 　-〿 和 ＀-￯，
// 那是全角标点区，碰了会出现「。 Astro」这种错误间距。
const CJK = '\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
const LATIN = 'A-Za-z0-9';

const CJK_THEN_LATIN = new RegExp(`([${CJK}])([${LATIN}])`, 'g');
const LATIN_THEN_CJK = new RegExp(`([${LATIN}])([${CJK}])`, 'g');

export function remarkCjkSpacing() {
  return (tree) => visit(tree);
}

function visit(node) {
  if (node.type === 'text' && typeof node.value === 'string') {
    node.value = addSpacing(node.value);
  }

  // 链接标题和图片 alt 也是给人读的，一并处理
  if (node.type === 'image' && typeof node.alt === 'string') {
    node.alt = addSpacing(node.alt);
  }
  if ((node.type === 'link' || node.type === 'image') && typeof node.title === 'string') {
    node.title = addSpacing(node.title);
  }

  for (const child of node.children ?? []) visit(child);
}

function addSpacing(value) {
  return value.replace(CJK_THEN_LATIN, '$1 $2').replace(LATIN_THEN_CJK, '$1 $2');
}
