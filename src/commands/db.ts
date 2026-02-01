/**
 * Database Commands
 */

import type { Command } from 'commander';
import { NotionClient } from '../lib/notion-client.js';
import { createCliContext, output, error, normalizeId } from '../cli/shared.js';

export function registerDbCommands(program: Command): void {
  const db = program.command('db').description('Database operations');

  db
    .command('get')
    .description('Get database schema')
    .argument('<id>', 'Database ID')
    .action(async (id: string) => {
      const opts = program.opts();
      const ctx = createCliContext(opts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const result = await client.getDatabase(normalizeId(id));
      
      if (result.success && result.data) {
        output(ctx, result.data);
      } else {
        error(ctx, result.error ?? 'Failed to get database');
        process.exit(1);
      }
    });

  db
    .command('query')
    .description('Query database entries')
    .argument('<id>', 'Database ID')
    .option('--filter <json>', 'Filter as JSON')
    .option('--sort <json>', 'Sort as JSON array')
    .option('--cursor <cursor>', 'Pagination cursor')
    .action(async (id: string, opts: { filter?: string; sort?: string; cursor?: string }) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      let filter: Record<string, unknown> | undefined;
      let sorts: unknown[] | undefined;
      
      if (opts.filter) {
        try {
          filter = JSON.parse(opts.filter);
        } catch {
          error(ctx, 'Invalid filter JSON');
          process.exit(1);
        }
      }
      
      if (opts.sort) {
        try {
          sorts = JSON.parse(opts.sort);
        } catch {
          error(ctx, 'Invalid sort JSON');
          process.exit(1);
        }
      }
      
      const result = await client.queryDatabase(
        normalizeId(id),
        filter,
        sorts,
        opts.cursor
      );
      
      if (result.success && result.data) {
        output(ctx, result.data);
      } else {
        error(ctx, result.error ?? 'Failed to query database');
        process.exit(1);
      }
    });
}
