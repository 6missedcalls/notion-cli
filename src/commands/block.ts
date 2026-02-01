/**
 * Block Commands
 */

import type { Command } from 'commander';
import { readFile } from 'fs/promises';
import { NotionClient } from '../lib/notion-client.js';
import { createCliContext, output, error, success, normalizeId, readStdin } from '../cli/shared.js';
import type { Block } from '../lib/types.js';

export function registerBlockCommands(program: Command): void {
  const block = program.command('block').description('Block operations');

  block
    .command('get')
    .description('Get a block by ID')
    .argument('<id>', 'Block ID')
    .action(async (id: string) => {
      const opts = program.opts();
      const ctx = createCliContext(opts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const result = await client.getBlock(normalizeId(id));
      
      if (result.success && result.data) {
        output(ctx, result.data);
      } else {
        error(ctx, result.error ?? 'Failed to get block');
        process.exit(1);
      }
    });

  block
    .command('children')
    .description('Get child blocks of a page or block')
    .argument('<id>', 'Page or block ID')
    .option('--cursor <cursor>', 'Pagination cursor')
    .action(async (id: string, opts: { cursor?: string }) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const result = await client.getBlockChildren(normalizeId(id), opts.cursor);
      
      if (result.success && result.data) {
        output(ctx, result.data);
      } else {
        error(ctx, result.error ?? 'Failed to get block children');
        process.exit(1);
      }
    });

  block
    .command('append')
    .description('Append blocks to a page or block')
    .argument('<id>', 'Page or block ID')
    .option('--json <file>', 'JSON file containing blocks')
    .option('--stdin', 'Read blocks from stdin')
    .action(async (id: string, opts: { json?: string; stdin?: boolean }) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      let blocksData: string;
      
      if (opts.stdin) {
        blocksData = await readStdin();
      } else if (opts.json) {
        blocksData = await readFile(opts.json, 'utf-8');
      } else {
        error(ctx, 'Must specify --json <file> or --stdin');
        process.exit(1);
      }
      
      let parsed: { children: Block[] } | Block[];
      try {
        parsed = JSON.parse(blocksData);
      } catch {
        error(ctx, 'Invalid JSON');
        process.exit(1);
      }
      
      // Handle both { children: [...] } and [...] formats
      const children: Block[] = Array.isArray(parsed) ? parsed : parsed.children;
      
      if (!Array.isArray(children) || children.length === 0) {
        error(ctx, 'No blocks to append');
        process.exit(1);
      }
      
      const result = await client.appendBlocks(normalizeId(id), children);
      
      if (result.success && result.data) {
        output(ctx, result.data);
        if (!ctx.json) success(ctx, `Appended ${children.length} blocks`);
      } else {
        error(ctx, result.error ?? 'Failed to append blocks');
        process.exit(1);
      }
    });

  block
    .command('delete')
    .description('Delete a block')
    .argument('<id>', 'Block ID')
    .action(async (id: string) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const result = await client.deleteBlock(normalizeId(id));
      
      if (result.success) {
        if (!ctx.json) success(ctx, 'Block deleted');
        else output(ctx, { deleted: true });
      } else {
        error(ctx, result.error ?? 'Failed to delete block');
        process.exit(1);
      }
    });
}
