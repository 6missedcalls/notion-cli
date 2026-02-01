/**
 * CLI Program Setup
 * Registers all commands
 */

import { Command } from 'commander';
import { registerPageCommands } from '../commands/page.js';
import { registerBlockCommands } from '../commands/block.js';
import { registerDbCommands } from '../commands/db.js';
import { registerSearchCommand } from '../commands/search.js';
import { registerPushCommand } from '../commands/push.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('notion')
    .description('Fast Notion CLI for pages, databases, and blocks')
    .version('0.1.0')
    .option('--json', 'Output as JSON')
    .option('--quiet', 'Suppress non-error output');

  // Register commands
  registerPageCommands(program);
  registerBlockCommands(program);
  registerDbCommands(program);
  registerSearchCommand(program);
  registerPushCommand(program);

  return program;
}
