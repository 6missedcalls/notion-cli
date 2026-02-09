/**
 * Tests for Markdown to Notion blocks converter
 * Following TDD: Tests written first, covering all conversion scenarios
 */

import { describe, it, expect } from 'vitest';
import { markdownToBlocks, blocksToMarkdown } from './markdown.js';
import type { Block } from './types.js';

describe('markdownToBlocks', () => {
  describe('headings', () => {
    it('should convert # to heading_1', () => {
      const blocks = markdownToBlocks('# Main Title');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading_1');
      expect((blocks[0] as Extract<Block, { type: 'heading_1' }>).heading_1.rich_text[0].plain_text).toBe('Main Title');
    });

    it('should convert ## to heading_2', () => {
      const blocks = markdownToBlocks('## Section Title');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading_2');
      expect((blocks[0] as Extract<Block, { type: 'heading_2' }>).heading_2.rich_text[0].plain_text).toBe('Section Title');
    });

    it('should convert ### to heading_3', () => {
      const blocks = markdownToBlocks('### Subsection');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading_3');
      expect((blocks[0] as Extract<Block, { type: 'heading_3' }>).heading_3.rich_text[0].plain_text).toBe('Subsection');
    });
  });

  describe('paragraphs', () => {
    it('should convert plain text to paragraph', () => {
      const blocks = markdownToBlocks('This is a paragraph.');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('paragraph');
      expect((blocks[0] as Extract<Block, { type: 'paragraph' }>).paragraph.rich_text[0].plain_text).toBe('This is a paragraph.');
    });

    it('should skip empty lines', () => {
      const blocks = markdownToBlocks('First\n\nSecond');

      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('paragraph');
      expect(blocks[1].type).toBe('paragraph');
    });
  });

  describe('lists', () => {
    it('should convert - to bulleted list item', () => {
      const blocks = markdownToBlocks('- Item one');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('bulleted_list_item');
      expect((blocks[0] as Extract<Block, { type: 'bulleted_list_item' }>).bulleted_list_item.rich_text[0].plain_text).toBe('Item one');
    });

    it('should convert * to bulleted list item', () => {
      const blocks = markdownToBlocks('* Item with asterisk');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('bulleted_list_item');
    });

    it('should convert numbered lists', () => {
      const blocks = markdownToBlocks('1. First item\n2. Second item');

      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('numbered_list_item');
      expect(blocks[1].type).toBe('numbered_list_item');
      expect((blocks[0] as Extract<Block, { type: 'numbered_list_item' }>).numbered_list_item.rich_text[0].plain_text).toBe('First item');
    });

    it('should handle numbered list with any number', () => {
      const blocks = markdownToBlocks('42. Any number works');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('numbered_list_item');
    });
  });

  describe('checkboxes / todos', () => {
    it('should convert - [ ] to unchecked todo', () => {
      const blocks = markdownToBlocks('- [ ] Unchecked task');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('to_do');
      const todo = blocks[0] as Extract<Block, { type: 'to_do' }>;
      expect(todo.to_do.checked).toBe(false);
      expect(todo.to_do.rich_text[0].plain_text).toBe('Unchecked task');
    });

    it('should convert - [x] to checked todo', () => {
      const blocks = markdownToBlocks('- [x] Checked task');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('to_do');
      expect((blocks[0] as Extract<Block, { type: 'to_do' }>).to_do.checked).toBe(true);
    });

    it('should convert - [X] (uppercase) to checked todo', () => {
      const blocks = markdownToBlocks('- [X] Also checked');

      expect(blocks).toHaveLength(1);
      expect((blocks[0] as Extract<Block, { type: 'to_do' }>).to_do.checked).toBe(true);
    });
  });

  describe('code blocks', () => {
    it('should convert fenced code block', () => {
      const markdown = '```javascript\nconst x = 1;\n```';
      const blocks = markdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
      const code = blocks[0] as Extract<Block, { type: 'code' }>;
      expect(code.code.language).toBe('javascript');
      expect(code.code.rich_text[0].plain_text).toBe('const x = 1;');
    });

    it('should handle code block without language', () => {
      const markdown = '```\nplain code\n```';
      const blocks = markdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect((blocks[0] as Extract<Block, { type: 'code' }>).code.language).toBe('plain text');
    });

    it('should handle multiline code blocks', () => {
      const markdown = '```python\ndef hello():\n    print("Hi")\n```';
      const blocks = markdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect((blocks[0] as Extract<Block, { type: 'code' }>).code.rich_text[0].plain_text).toBe('def hello():\n    print("Hi")');
    });
  });

  describe('blockquotes', () => {
    it('should convert > to quote', () => {
      const blocks = markdownToBlocks('> This is a quote');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('quote');
      expect((blocks[0] as Extract<Block, { type: 'quote' }>).quote.rich_text[0].plain_text).toBe('This is a quote');
    });
  });

  describe('dividers', () => {
    it('should convert --- to divider', () => {
      const blocks = markdownToBlocks('---');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('divider');
    });

    it('should convert *** to divider', () => {
      const blocks = markdownToBlocks('***');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('divider');
    });

    it('should convert ___ to divider', () => {
      const blocks = markdownToBlocks('___');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('divider');
    });

    it('should handle longer dividers', () => {
      const blocks = markdownToBlocks('----------');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('divider');
    });
  });

  describe('callouts', () => {
    it('should convert > [!NOTE] to callout with info emoji', () => {
      const blocks = markdownToBlocks('> [!NOTE] This is a note');

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('callout');
      const callout = blocks[0] as Extract<Block, { type: 'callout' }>;
      expect(callout.callout.icon?.emoji).toBe('ℹ️');
      expect(callout.callout.rich_text[0].plain_text).toBe('This is a note');
    });

    it('should convert > [!WARNING] to callout with warning emoji', () => {
      const blocks = markdownToBlocks('> [!WARNING] Be careful');

      expect(blocks).toHaveLength(1);
      expect((blocks[0] as Extract<Block, { type: 'callout' }>).callout.icon?.emoji).toBe('⚠️');
    });

    it('should convert > [!TIP] to callout with tip emoji', () => {
      const blocks = markdownToBlocks('> [!TIP] Helpful tip');

      expect(blocks).toHaveLength(1);
      expect((blocks[0] as Extract<Block, { type: 'callout' }>).callout.icon?.emoji).toBe('💡');
    });

    it('should convert > [!IMPORTANT] to callout with important emoji', () => {
      const blocks = markdownToBlocks('> [!IMPORTANT] Read this');

      expect(blocks).toHaveLength(1);
      expect((blocks[0] as Extract<Block, { type: 'callout' }>).callout.icon?.emoji).toBe('❗');
    });

    it('should handle callout without text after type', () => {
      const blocks = markdownToBlocks('> [!NOTE]');

      expect(blocks).toHaveLength(1);
      expect((blocks[0] as Extract<Block, { type: 'callout' }>).callout.rich_text[0].plain_text).toBe('NOTE');
    });
  });

  describe('tables', () => {
    it('should convert table to code block (preserving content)', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
      const blocks = markdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code');
    });
  });

  describe('mixed content', () => {
    it('should handle document with multiple block types', () => {
      const markdown = `# Title

This is a paragraph.

- List item 1
- List item 2

> A quote

---

\`\`\`js
code here
\`\`\``;

      const blocks = markdownToBlocks(markdown);

      expect(blocks.length).toBeGreaterThan(5);
      expect(blocks[0].type).toBe('heading_1');
      expect(blocks.find(b => b.type === 'paragraph')).toBeDefined();
      expect(blocks.filter(b => b.type === 'bulleted_list_item')).toHaveLength(2);
      expect(blocks.find(b => b.type === 'quote')).toBeDefined();
      expect(blocks.find(b => b.type === 'divider')).toBeDefined();
      expect(blocks.find(b => b.type === 'code')).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const blocks = markdownToBlocks('');
      expect(blocks).toHaveLength(0);
    });

    it('should handle string with only whitespace', () => {
      const blocks = markdownToBlocks('   \n\n   ');
      expect(blocks).toHaveLength(0);
    });
  });
});

describe('blocksToMarkdown', () => {
  describe('headings', () => {
    it('should convert heading_1 to #', () => {
      const blocks: Block[] = [
        { type: 'heading_1', heading_1: { rich_text: [{ plain_text: 'Title' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('# Title');
    });

    it('should convert heading_2 to ##', () => {
      const blocks: Block[] = [
        { type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Section' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('## Section');
    });

    it('should convert heading_3 to ###', () => {
      const blocks: Block[] = [
        { type: 'heading_3', heading_3: { rich_text: [{ plain_text: 'Subsection' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('### Subsection');
    });
  });

  describe('paragraphs', () => {
    it('should convert paragraph to plain text', () => {
      const blocks: Block[] = [
        { type: 'paragraph', paragraph: { rich_text: [{ plain_text: 'Hello world' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('Hello world');
    });
  });

  describe('lists', () => {
    it('should convert bulleted list item to -', () => {
      const blocks: Block[] = [
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: 'Item' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('- Item');
    });

    it('should convert numbered list item to 1.', () => {
      const blocks: Block[] = [
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: 'Item' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('1. Item');
    });
  });

  describe('todos', () => {
    it('should convert unchecked todo to - [ ]', () => {
      const blocks: Block[] = [
        { type: 'to_do', to_do: { rich_text: [{ plain_text: 'Task' } as any], checked: false } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('- [ ] Task');
    });

    it('should convert checked todo to - [x]', () => {
      const blocks: Block[] = [
        { type: 'to_do', to_do: { rich_text: [{ plain_text: 'Done' } as any], checked: true } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('- [x] Done');
    });
  });

  describe('code blocks', () => {
    it('should convert code block to fenced code', () => {
      const blocks: Block[] = [
        { type: 'code', code: { rich_text: [{ plain_text: 'const x = 1;' } as any], language: 'javascript' } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('```javascript');
      expect(markdown).toContain('const x = 1;');
      expect(markdown).toContain('```');
    });
  });

  describe('quotes', () => {
    it('should convert quote to >', () => {
      const blocks: Block[] = [
        { type: 'quote', quote: { rich_text: [{ plain_text: 'Quoted text' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('> Quoted text');
    });
  });

  describe('dividers', () => {
    it('should convert divider to ---', () => {
      const blocks: Block[] = [
        { type: 'divider', divider: {} },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('---');
    });
  });

  describe('callouts', () => {
    it('should convert callout to > with emoji', () => {
      const blocks: Block[] = [
        { type: 'callout', callout: { rich_text: [{ plain_text: 'Note' } as any], icon: { emoji: '💡' } } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('> 💡 Note');
    });

    it('should handle callout without icon', () => {
      const blocks: Block[] = [
        { type: 'callout', callout: { rich_text: [{ plain_text: 'Note' } as any] } },
      ];

      const markdown = blocksToMarkdown(blocks);
      expect(markdown).toContain('> 💡 Note');
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain content through markdown -> blocks -> markdown', () => {
      const original = '# Title\n\nParagraph text.\n\n- List item\n\n> Quote';
      const blocks = markdownToBlocks(original);
      const result = blocksToMarkdown(blocks);

      expect(result).toContain('# Title');
      expect(result).toContain('Paragraph text.');
      expect(result).toContain('- List item');
      expect(result).toContain('> Quote');
    });
  });
});
