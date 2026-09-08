const HTML_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ndash: "-",
  mdash: "--",
  hellip: "...",
  lsquo: "'",
  rsquo: "'",
  ldquo: '"',
  rdquo: '"',
  bull: "•",
  copy: "(C)",
  reg: "(R)",
  trade: "(TM)"
};

// Recognises Azure DevOps rich-text HTML: known tags or HTML entities.
const HTML_LIKE_PATTERN = /<(?:\/)?(?:div|p|ul|ol|li|br|table|tr|td|th|thead|tbody|h[1-6]|b|strong|i|em|u|s|strike|span|a|code|pre|blockquote|font)\b[^<>]*>|&(?:#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z]{2,8});/;

const MD_HEADING = /^#{1,6}\s+/;
const MD_HR = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const MD_FENCE = /^\s*(?:```+|~~~+)/;
const MD_TASK_LIST = /^(\s*)[-*+]\s+\[([ xX])\]\s+/;
const MD_BULLET = /^(\s*)[-*+]\s+/;
const MD_BLOCKQUOTE = /^\s*>\s?/;
const MD_IMAGE = /!\[([^\]]*)\]\(([^)]*)\)/g;
const MD_LINK = /\[([^\]]+)\]\(([^)]+)\)/g;
const MD_BOLD_STAR = /\*\*([^*\n]+)\*\*/g;
const MD_BOLD_UNDERSCORE = /__([^_\n]+)__/g;
const MD_ITALIC_STAR = /\*([^*\n]+)\*/g;
const MD_ITALIC_UNDERSCORE = /(?<![\w\\])_(?!\s)([^_\n]+?)(?<!\s)_(?!\w)/g;
const MD_STRIKE = /~~([^~\n]+)~~/g;
const MD_CODE_SPAN = /`([^`\n]+)`/g;

/**
 * Converts Azure DevOps rich-text HTML (e.g. acceptance criteria) into plain
 * text suitable for PDF rendering.
 *
 * - List items (<li>) become "• " bullet points
 * - Block-level closing tags (<p>, <div>, <li>, headings, table rows) become line breaks
 * - Remaining tags are stripped
 * - Named and numeric HTML entities are decoded
 * - Runs of whitespace are collapsed (newlines preserved, max one blank line)
 */
function stripHtml(html: string): string {
  if (!html) return "";

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|ul|ol|h[1-6]|tr|table)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (match, name: string) => HTML_ENTITIES[name.toLowerCase()] ?? match)
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMarkdownLine(line: string): string {
  if (MD_FENCE.test(line) || MD_HR.test(line)) return "";

  let out = line.replace(MD_BLOCKQUOTE, "").replace(MD_HEADING, "");

  const task = out.match(MD_TASK_LIST);
  out = task && task[1] !== undefined && task[2] !== undefined ? out.replace(MD_TASK_LIST, `$1• [${task[2]}] `) : out.replace(MD_BULLET, "$1• ");

  return out.replace(MD_IMAGE, "").replace(MD_LINK, "$1").replace(MD_BOLD_STAR, "$1").replace(MD_BOLD_UNDERSCORE, "$1").replace(MD_ITALIC_STAR, "$1").replace(MD_ITALIC_UNDERSCORE, "$1").replace(MD_STRIKE, "$1").replace(MD_CODE_SPAN, "$1");
}

/**
 * Normalises GitHub-flavoured Markdown into plain text: -, * and + bullets
 * become "• " points (task list checkboxes are kept as [x]/[ ]), emphasis and
 * code markers are stripped, headings and blockquote markers are removed, and
 * links are reduced to their text.
 */
function normalizeMarkdown(markdown: string): string {
  return markdown
    .split("\n")
    .map(normalizeMarkdownLine)
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Converts acceptance criteria into plain text for PDF rendering, supporting
 * both rich-text HTML and Markdown content: content containing HTML tags or
 * entities is treated as HTML, everything else as Markdown.
 */
export function toPlainText(text: string): string {
  if (!text) return "";
  return HTML_LIKE_PATTERN.test(text) ? stripHtml(text) : normalizeMarkdown(text);
}
