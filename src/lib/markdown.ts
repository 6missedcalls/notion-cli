/**
 * Markdown to Notion Blocks Converter
 * Simple, fast conversion for common markdown patterns
 */

import type { Block } from './types.js';
import {
  paragraph,
  heading1,
  heading2,
  heading3,
  bulletedListItem,
  numberedListItem,
  toDo,
  codeBlock,
  quote,
  divider,
  callout,
  richText,
} from './types.js';

export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Code block (fenced)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'plain text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push(codeBlock(codeLines.join('\n'), lang));
      i++; // skip closing ```
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      blocks.push(heading1(trimmed.slice(2)));
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(heading2(trimmed.slice(3)));
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push(heading3(trimmed.slice(4)));
      i++;
      continue;
    }

    // Divider
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push(divider());
      i++;
      continue;
    }

    // Callout (using > [!NOTE] or > [!TIP] etc) - check before regular blockquote
    const calloutMatch = trimmed.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i);
    if (calloutMatch) {
      const type = calloutMatch[1].toUpperCase();
      const text = calloutMatch[2];
      const emoji = type === 'WARNING' || type === 'CAUTION' ? '⚠️' :
                   type === 'TIP' ? '💡' :
                   type === 'IMPORTANT' ? '❗' : 'ℹ️';
      blocks.push(callout(text || type, emoji));
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      blocks.push(quote(trimmed.slice(2)));
      i++;
      continue;
    }

    // Checkbox / Todo
    if (trimmed.startsWith('- [ ] ')) {
      blocks.push(toDo(trimmed.slice(6), false));
      i++;
      continue;
    }
    if (trimmed.startsWith('- [x] ') || trimmed.startsWith('- [X] ')) {
      blocks.push(toDo(trimmed.slice(6), true));
      i++;
      continue;
    }

    // Bulleted list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push(bulletedListItem(trimmed.slice(2)));
      i++;
      continue;
    }

    // Numbered list
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      blocks.push(numberedListItem(numberedMatch[2]));
      i++;
      continue;
    }

    // Table (convert to code block for simplicity)
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      // For now, preserve tables as code
      blocks.push(codeBlock(tableLines.join('\n'), 'plain text'));
      continue;
    }

    // Default: paragraph
    blocks.push(paragraph(trimmed));
    i++;
  }

  return blocks;
}

export function blocksToMarkdown(blocks: Block[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const getText = (richTextArr: { plain_text: string }[]): string =>
      richTextArr.map(rt => rt.plain_text).join('');

    switch (block.type) {
      case 'paragraph':
        lines.push(getText(block.paragraph.rich_text));
        break;
      case 'heading_1':
        lines.push(`# ${getText(block.heading_1.rich_text)}`);
        break;
      case 'heading_2':
        lines.push(`## ${getText(block.heading_2.rich_text)}`);
        break;
      case 'heading_3':
        lines.push(`### ${getText(block.heading_3.rich_text)}`);
        break;
      case 'bulleted_list_item':
        lines.push(`- ${getText(block.bulleted_list_item.rich_text)}`);
        break;
      case 'numbered_list_item':
        lines.push(`1. ${getText(block.numbered_list_item.rich_text)}`);
        break;
      case 'to_do':
        const checked = block.to_do.checked ? 'x' : ' ';
        lines.push(`- [${checked}] ${getText(block.to_do.rich_text)}`);
        break;
      case 'code':
        lines.push(`\`\`\`${block.code.language}`);
        lines.push(getText(block.code.rich_text));
        lines.push('```');
        break;
      case 'quote':
        lines.push(`> ${getText(block.quote.rich_text)}`);
        break;
      case 'divider':
        lines.push('---');
        break;
      case 'callout':
        const emoji = block.callout.icon?.emoji ?? '💡';
        lines.push(`> ${emoji} ${getText(block.callout.rich_text)}`);
        break;
    }
    lines.push('');
  }

  return lines.join('\n');
}
