/**
 * Tests for Notion API types and block helper functions
 * Following TDD: Tests written first, covering all helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  richText,
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
} from './types.js';

describe('richText', () => {
  it('should create basic rich text with default annotations', () => {
    const result = richText('Hello');

    expect(result).toEqual({
      type: 'text',
      text: { content: 'Hello', link: null },
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: 'default',
      },
      plain_text: 'Hello',
      href: null,
    });
  });

  it('should create bold rich text', () => {
    const result = richText('Bold text', { bold: true });

    expect(result.annotations.bold).toBe(true);
    expect(result.annotations.italic).toBe(false);
  });

  it('should create italic rich text', () => {
    const result = richText('Italic text', { italic: true });

    expect(result.annotations.italic).toBe(true);
    expect(result.annotations.bold).toBe(false);
  });

  it('should create code-styled rich text', () => {
    const result = richText('const x = 1', { code: true });

    expect(result.annotations.code).toBe(true);
  });

  it('should create rich text with multiple annotations', () => {
    const result = richText('Bold and italic', { bold: true, italic: true });

    expect(result.annotations.bold).toBe(true);
    expect(result.annotations.italic).toBe(true);
  });

  it('should create rich text with custom color', () => {
    const result = richText('Colored text', { color: 'red' });

    expect(result.annotations.color).toBe('red');
  });

  it('should handle empty content', () => {
    const result = richText('');

    expect(result.text.content).toBe('');
    expect(result.plain_text).toBe('');
  });
});

describe('paragraph', () => {
  it('should create a paragraph block', () => {
    const result = paragraph('This is a paragraph.');

    expect(result.type).toBe('paragraph');
    expect(result.paragraph.rich_text).toHaveLength(1);
    expect(result.paragraph.rich_text[0].plain_text).toBe('This is a paragraph.');
  });

  it('should create empty paragraph', () => {
    const result = paragraph('');

    expect(result.type).toBe('paragraph');
    expect(result.paragraph.rich_text[0].plain_text).toBe('');
  });
});

describe('heading1', () => {
  it('should create a heading_1 block', () => {
    const result = heading1('Main Title');

    expect(result.type).toBe('heading_1');
    expect(result.heading_1.rich_text).toHaveLength(1);
    expect(result.heading_1.rich_text[0].plain_text).toBe('Main Title');
  });
});

describe('heading2', () => {
  it('should create a heading_2 block', () => {
    const result = heading2('Section Title');

    expect(result.type).toBe('heading_2');
    expect(result.heading_2.rich_text).toHaveLength(1);
    expect(result.heading_2.rich_text[0].plain_text).toBe('Section Title');
  });
});

describe('heading3', () => {
  it('should create a heading_3 block', () => {
    const result = heading3('Subsection Title');

    expect(result.type).toBe('heading_3');
    expect(result.heading_3.rich_text).toHaveLength(1);
    expect(result.heading_3.rich_text[0].plain_text).toBe('Subsection Title');
  });
});

describe('bulletedListItem', () => {
  it('should create a bulleted list item block', () => {
    const result = bulletedListItem('List item content');

    expect(result.type).toBe('bulleted_list_item');
    expect(result.bulleted_list_item.rich_text).toHaveLength(1);
    expect(result.bulleted_list_item.rich_text[0].plain_text).toBe('List item content');
  });
});

describe('numberedListItem', () => {
  it('should create a numbered list item block', () => {
    const result = numberedListItem('Numbered item content');

    expect(result.type).toBe('numbered_list_item');
    expect(result.numbered_list_item.rich_text).toHaveLength(1);
    expect(result.numbered_list_item.rich_text[0].plain_text).toBe('Numbered item content');
  });
});

describe('toDo', () => {
  it('should create an unchecked to-do block by default', () => {
    const result = toDo('Task to complete');

    expect(result.type).toBe('to_do');
    expect(result.to_do.rich_text).toHaveLength(1);
    expect(result.to_do.rich_text[0].plain_text).toBe('Task to complete');
    expect(result.to_do.checked).toBe(false);
  });

  it('should create a checked to-do block', () => {
    const result = toDo('Completed task', true);

    expect(result.to_do.checked).toBe(true);
  });

  it('should create an unchecked to-do block when explicitly set', () => {
    const result = toDo('Pending task', false);

    expect(result.to_do.checked).toBe(false);
  });
});

describe('codeBlock', () => {
  it('should create a code block with default language', () => {
    const result = codeBlock('const x = 1;');

    expect(result.type).toBe('code');
    expect(result.code.rich_text).toHaveLength(1);
    expect(result.code.rich_text[0].plain_text).toBe('const x = 1;');
    expect(result.code.language).toBe('plain text');
  });

  it('should create a code block with specified language', () => {
    const result = codeBlock('def hello():\n    print("Hello")', 'python');

    expect(result.code.language).toBe('python');
    expect(result.code.rich_text[0].plain_text).toBe('def hello():\n    print("Hello")');
  });

  it('should handle multiline code', () => {
    const code = `function test() {
  return true;
}`;
    const result = codeBlock(code, 'javascript');

    expect(result.code.rich_text[0].plain_text).toBe(code);
  });
});

describe('quote', () => {
  it('should create a quote block', () => {
    const result = quote('This is a quoted text.');

    expect(result.type).toBe('quote');
    expect(result.quote.rich_text).toHaveLength(1);
    expect(result.quote.rich_text[0].plain_text).toBe('This is a quoted text.');
  });
});

describe('divider', () => {
  it('should create a divider block', () => {
    const result = divider();

    expect(result.type).toBe('divider');
    expect(result.divider).toEqual({});
  });
});

describe('callout', () => {
  it('should create a callout block with default emoji', () => {
    const result = callout('Important information');

    expect(result.type).toBe('callout');
    expect(result.callout.rich_text).toHaveLength(1);
    expect(result.callout.rich_text[0].plain_text).toBe('Important information');
    expect(result.callout.icon).toEqual({ emoji: '💡' });
  });

  it('should create a callout block with custom emoji', () => {
    const result = callout('Warning message', '⚠️');

    expect(result.callout.icon).toEqual({ emoji: '⚠️' });
  });

  it('should create a callout with info emoji', () => {
    const result = callout('Info message', 'ℹ️');

    expect(result.callout.icon).toEqual({ emoji: 'ℹ️' });
  });
});
