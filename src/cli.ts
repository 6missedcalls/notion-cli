#!/usr/bin/env node
/**
 * notion - Fast Notion CLI
 *
 * Usage:
 *   notion page get <id>
 *   notion page create --parent <id> --title "Title"
 *   notion block append <id> --json blocks.json
 *   notion push file.md --parent <id>
 *   notion search "query"
 */

import { createProgram } from './cli/program.js';

const program = createProgram();
program.parse(process.argv);
