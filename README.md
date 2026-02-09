# notion-cli

Fast Notion CLI for pages, databases, and blocks.

Created for use by [Openclaw](https://github.com/openclaw-ai/openclaw).

## Install

```bash
npm install -g @6missedcalls/notion-cli
```

## Setup

```bash
export NOTION_API_KEY="secret_xxx"
```

Get your API key from https://www.notion.so/my-integrations

## Usage

### Pages

```bash
# Get a page
notion page get <page-id>

# Create a page
notion page create --parent <page-id> --title "My Page"

# Create in database
notion page create --parent <db-id> --title "Entry" --database

# Archive
notion page archive <page-id>
```

### Blocks

```bash
# Get block children
notion block children <page-id>

# Append blocks from JSON file
notion block append <page-id> --json blocks.json

# Append from stdin
echo '[{"type":"paragraph","paragraph":{"rich_text":[{"type":"text","text":{"content":"Hello"}}]}}]' | notion block append <page-id> --stdin

# Delete
notion block delete <block-id>
```

### Databases

```bash
# Get database schema
notion db get <database-id>

# Query with filter
notion db query <database-id> --filter '{"property":"Status","select":{"equals":"Done"}}'
```

### Search

```bash
# Search everything
notion search "query"

# Search only pages
notion search "query" --filter page

# Search only databases
notion search --filter database
```

### Push (Markdown/JSON)

```bash
# Push markdown file to page
notion push README.md --parent <page-id>

# Push JSON blocks
notion push blocks.json --parent <page-id>

# Push from stdin
cat notes.md | notion push --stdin --parent <page-id>

# Create new page and push content
notion push content.md --parent <page-id> --title "New Page"
```

## Options

All commands support:
- `--json` - Output as JSON
- `--quiet` - Suppress non-error output

## Library Usage

```typescript
import { NotionClient, markdownToBlocks } from '@6missedcalls/notion-cli';

const client = new NotionClient({ apiKey: process.env.NOTION_API_KEY });

// Push markdown
const blocks = markdownToBlocks('# Hello\n\nWorld');
await client.appendBlocks(pageId, blocks);
```

## License

MIT
