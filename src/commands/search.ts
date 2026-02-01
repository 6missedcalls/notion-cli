/**
 * Search Command
 */

import type { Command } from 'commander';
import { NotionClient } from '../lib/notion-client.js';
import { createCliContext, output, error } from '../cli/shared.js';

export function registerSearchCommand(program: Command): void {
  program
    .command('search')
    .description('Search pages and databases')
    .argument('[query]', 'Search query')
    .option('--filter <type>', 'Filter by type: page or database')
    .option('--cursor <cursor>', 'Pagination cursor')
    .action(async (query: string | undefined, opts: { filter?: string; cursor?: string }) => {
      const globalOpts = program.opts();
      const ctx = createCliContext(globalOpts);
      const client = new NotionClient({ apiKey: ctx.apiKey });
      
      const filterType = opts.filter as 'page' | 'database' | undefined;
      
      if (filterType && filterType !== 'page' && filterType !== 'database') {
        error(ctx, 'Filter must be "page" or "database"');
        process.exit(1);
      }
      
      const result = await client.search(query, filterType, opts.cursor);
      
      if (result.success && result.data) {
        output(ctx, result.data);
      } else {
        error(ctx, result.error ?? 'Search failed');
        process.exit(1);
      }
    });
}
