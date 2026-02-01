/**
 * Push Command
 * Push markdown or JSON blocks to a Notion page
 */

import type { Command } from 'commander';
import { readFile } from 'fs/promises';
import { NotionClient } from '../lib/notion-client.js';
import { markdownToBlocks } from '../lib/markdown.js';
import { createCliContext, output, error, success, normalizeId, readStdin } from '../cli/shared.js';
import type { Block } from '../lib/types.js';

export function registerPushCommand(program: Command): void {
  program
    .command('push')
    .description('Push markdown or JSON blocks to a Notion page')
    .argument('[file]', 'File to push (.md or .json)')
    .requiredOption('--parent <id>', 'Parent page ID')
    .option('--stdin', 'Read from stdin')
    .option('--format <type>', 'Force format: md or json')
    .option('--title <title>', 'Create a new child page with this title first')
    .action(async (
      file: string | undefined,
      opts: { parent: string; stdin?: boolean; format?: string; title?: string }
    ) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      // Get content
      let content: string;
      if (opts.stdin) {
        content = await readStdin();
      } else if (file) {
        content = await readFile(file, 'utf-8');
      } else {
        error(ctx, 'Must specify a file or --stdin');
        process.exit(1);
      }
      
      // Determine format
      let format = opts.format;
      if (!format && file) {
        if (file.endsWith('.json')) format = 'json';
        else format = 'md';
      }
      format = format ?? 'md';
      
      // Parse content to blocks
      let blocks: Block[];
      if (format === 'json') {
        try {
          const parsed = JSON.parse(content);
          blocks = Array.isArray(parsed) ? parsed : parsed.children ?? [];
        } catch {
          error(ctx, 'Invalid JSON');
          process.exit(1);
        }
      } else {
        blocks = markdownToBlocks(content);
      }
      
      if (blocks.length === 0) {
        error(ctx, 'No blocks to push');
        process.exit(1);
      }
      
      let targetId = normalizeId(opts.parent);
      
      // Optionally create a child page first
      if (opts.title) {
        const pageResult = await client.createPage(targetId, opts.title, 'page');
        if (!pageResult.success || !pageResult.data) {
          error(ctx, pageResult.error ?? 'Failed to create page');
          process.exit(1);
        }
        targetId = pageResult.data.id.replace(/-/g, '');
        if (!ctx.json) {
          success(ctx, `Created page: ${pageResult.data.url}`);
        }
      }
      
      // Push blocks
      const result = await client.appendBlocks(targetId, blocks);
      
      if (result.success && result.data) {
        if (ctx.json) {
          output(ctx, {
            success: true,
            blocksAppended: blocks.length,
            pageId: targetId,
          });
        } else {
          success(ctx, `Pushed ${blocks.length} blocks to page`);
        }
      } else {
        error(ctx, result.error ?? 'Failed to push blocks');
        process.exit(1);
      }
    });
}
