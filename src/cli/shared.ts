/**
 * CLI Context and Shared Utilities
 */

import kleur from 'kleur';

export interface CliContext {
  apiKey: string;
  json: boolean;
  quiet: boolean;
  colors: typeof kleur;
}

export function createCliContext(options: { json?: boolean; quiet?: boolean }): CliContext {
  const apiKey = process.env.NOTION_API_KEY;
  
  if (!apiKey) {
    console.error(kleur.red('Error: NOTION_API_KEY environment variable not set'));
    process.exit(1);
  }

  return {
    apiKey,
    json: options.json ?? false,
    quiet: options.quiet ?? false,
    colors: kleur,
  };
}

export function output(ctx: CliContext, data: unknown): void {
  if (ctx.quiet) return;
  
  if (ctx.json) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === 'string') {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function error(ctx: CliContext, message: string): void {
  console.error(ctx.colors.red(`Error: ${message}`));
}

export function success(ctx: CliContext, message: string): void {
  if (ctx.quiet) return;
  console.log(ctx.colors.green(`✓ ${message}`));
}

export function info(ctx: CliContext, message: string): void {
  if (ctx.quiet) return;
  console.log(ctx.colors.blue(`ℹ ${message}`));
}

export function normalizeId(id: string): string {
  // Remove hyphens and extract ID from URL if needed
  const urlMatch = id.match(/([a-f0-9]{32})/i);
  if (urlMatch) {
    return urlMatch[1];
  }
  return id.replace(/-/g, '');
}

export function formatId(id: string): string {
  // Add hyphens to UUID format: 8-4-4-4-12
  const clean = id.replace(/-/g, '');
  if (clean.length !== 32) return id;
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}

export function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}
