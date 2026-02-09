/**
 * Page Commands
 */

import type { Command } from 'commander';
import { NotionClient } from '../lib/notion-client.js';
import { createCliContext, output, error, success, normalizeId, validateUrl } from '../cli/shared.js';

export function registerPageCommands(program: Command): void {
  const page = program.command('page').description('Page operations');

  page
    .command('get')
    .description('Get a page by ID')
    .argument('<id>', 'Page ID or URL')
    .action(async (id: string) => {
      const opts = program.opts();
      const ctx = createCliContext(opts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const result = await client.getPage(normalizeId(id));
      
      if (result.success && result.data) {
        output(ctx, result.data);
      } else {
        error(ctx, result.error ?? 'Failed to get page');
        process.exit(1);
      }
    });

  page
    .command('create')
    .description('Create a new page')
    .requiredOption('--parent <id>', 'Parent page or database ID')
    .requiredOption('--title <title>', 'Page title')
    .option('--database', 'Parent is a database (not a page)')
    .action(async (opts: { parent: string; title: string; database?: boolean }) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const parentType = opts.database ? 'database' : 'page';
      const result = await client.createPage(
        normalizeId(opts.parent),
        opts.title,
        parentType
      );
      
      if (result.success && result.data) {
        output(ctx, result.data);
        if (!ctx.json) {
          success(ctx, `Created page: ${result.data.url}`);
        }
      } else {
        error(ctx, result.error ?? 'Failed to create page');
        process.exit(1);
      }
    });

  page
    .command('update')
    .description('Update a page')
    .argument('<id>', 'Page ID')
    .option('--icon <emoji>', 'Set page icon')
    .option('--cover <url>', 'Set cover image URL')
    .option('--archived', 'Archive the page')
    .action(async (id: string, opts: { icon?: string; cover?: string; archived?: boolean }) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const updates: Record<string, unknown> = {};
      if (opts.icon) updates.icon = { type: 'emoji', emoji: opts.icon };
      if (opts.cover) {
        try {
          const validatedUrl = validateUrl(opts.cover);
          updates.cover = { type: 'external', external: { url: validatedUrl } };
        } catch (e) {
          error(ctx, e instanceof Error ? e.message : 'Invalid cover URL');
          process.exit(1);
        }
      }
      if (opts.archived) updates.archived = true;
      
      const result = await client.updatePage(normalizeId(id), updates);
      
      if (result.success && result.data) {
        output(ctx, result.data);
        if (!ctx.json) success(ctx, 'Page updated');
      } else {
        error(ctx, result.error ?? 'Failed to update page');
        process.exit(1);
      }
    });

  page
    .command('archive')
    .description('Archive a page')
    .argument('<id>', 'Page ID')
    .action(async (id: string) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const result = await client.archivePage(normalizeId(id));
      
      if (result.success) {
        if (!ctx.json) success(ctx, 'Page archived');
        else output(ctx, { archived: true });
      } else {
        error(ctx, result.error ?? 'Failed to archive page');
        process.exit(1);
      }
    });
}
