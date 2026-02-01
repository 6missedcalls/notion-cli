// Notion API Types

export interface RichText {
  type: 'text';
  text: {
    content: string;
    link: { url: string } | null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href: string | null;
}

export interface BlockBase {
  object?: 'block';
  id?: string;
  type: string;
}

export interface ParagraphBlock extends BlockBase {
  type: 'paragraph';
  paragraph: { rich_text: RichText[] };
}

export interface Heading1Block extends BlockBase {
  type: 'heading_1';
  heading_1: { rich_text: RichText[] };
}

export interface Heading2Block extends BlockBase {
  type: 'heading_2';
  heading_2: { rich_text: RichText[] };
}

export interface Heading3Block extends BlockBase {
  type: 'heading_3';
  heading_3: { rich_text: RichText[] };
}

export interface BulletedListItemBlock extends BlockBase {
  type: 'bulleted_list_item';
  bulleted_list_item: { rich_text: RichText[] };
}

export interface NumberedListItemBlock extends BlockBase {
  type: 'numbered_list_item';
  numbered_list_item: { rich_text: RichText[] };
}

export interface ToDoBlock extends BlockBase {
  type: 'to_do';
  to_do: { rich_text: RichText[]; checked: boolean };
}

export interface CodeBlock extends BlockBase {
  type: 'code';
  code: { rich_text: RichText[]; language: string };
}

export interface QuoteBlock extends BlockBase {
  type: 'quote';
  quote: { rich_text: RichText[] };
}

export interface DividerBlock extends BlockBase {
  type: 'divider';
  divider: Record<string, never>;
}

export interface CalloutBlock extends BlockBase {
  type: 'callout';
  callout: { rich_text: RichText[]; icon?: { emoji: string } };
}

export type Block =
  | ParagraphBlock
  | Heading1Block
  | Heading2Block
  | Heading3Block
  | BulletedListItemBlock
  | NumberedListItemBlock
  | ToDoBlock
  | CodeBlock
  | QuoteBlock
  | DividerBlock
  | CalloutBlock;

export interface AppendBlocksRequest {
  children: Block[];
}

export interface NotionError {
  object: 'error';
  status: number;
  code: string;
  message: string;
}

export interface PageProperties {
  [key: string]: unknown;
}

export interface Page {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  properties: PageProperties;
  url: string;
}

export interface Database {
  object: 'database';
  id: string;
  title: RichText[];
  properties: Record<string, unknown>;
}

// Helper to create rich_text
export function richText(content: string, options?: Partial<RichText['annotations']>): RichText {
  return {
    type: 'text',
    text: { content, link: null },
    annotations: {
      bold: options?.bold ?? false,
      italic: options?.italic ?? false,
      strikethrough: options?.strikethrough ?? false,
      underline: options?.underline ?? false,
      code: options?.code ?? false,
      color: options?.color ?? 'default',
    },
    plain_text: content,
    href: null,
  };
}

// Helper to create blocks
export function paragraph(text: string): ParagraphBlock {
  return { type: 'paragraph', paragraph: { rich_text: [richText(text)] } };
}

export function heading1(text: string): Heading1Block {
  return { type: 'heading_1', heading_1: { rich_text: [richText(text)] } };
}

export function heading2(text: string): Heading2Block {
  return { type: 'heading_2', heading_2: { rich_text: [richText(text)] } };
}

export function heading3(text: string): Heading3Block {
  return { type: 'heading_3', heading_3: { rich_text: [richText(text)] } };
}

export function bulletedListItem(text: string): BulletedListItemBlock {
  return { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [richText(text)] } };
}

export function numberedListItem(text: string): NumberedListItemBlock {
  return { type: 'numbered_list_item', numbered_list_item: { rich_text: [richText(text)] } };
}

export function toDo(text: string, checked = false): ToDoBlock {
  return { type: 'to_do', to_do: { rich_text: [richText(text)], checked } };
}

export function codeBlock(code: string, language = 'plain text'): CodeBlock {
  return { type: 'code', code: { rich_text: [richText(code)], language } };
}

export function quote(text: string): QuoteBlock {
  return { type: 'quote', quote: { rich_text: [richText(text)] } };
}

export function divider(): DividerBlock {
  return { type: 'divider', divider: {} };
}

export function callout(text: string, emoji = '💡'): CalloutBlock {
  return { type: 'callout', callout: { rich_text: [richText(text)], icon: { emoji } } };
}
