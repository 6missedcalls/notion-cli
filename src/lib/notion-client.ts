/**
 * Notion API Client
 * Handles all HTTP requests to Notion API
 */

import type { Block, Page, Database, NotionError } from './types.js';

const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export interface NotionClientOptions {
  apiKey: string;
  timeoutMs?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  object: 'list';
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export class NotionClient {
  private apiKey: string;
  private timeoutMs: number;

  constructor(options: NotionClientOptions) {
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${NOTION_API_URL}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json() as T | NotionError;

      if (!response.ok) {
        const error = data as NotionError;
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return { success: true, data: data as T };
    } catch (err) {
      clearTimeout(timeout);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  // Pages
  async getPage(pageId: string): Promise<ApiResponse<Page>> {
    return this.request<Page>('GET', `/pages/${pageId}`);
  }

  async createPage(
    parentId: string,
    title: string,
    parentType: 'page' | 'database' = 'page',
    properties?: Record<string, unknown>
  ): Promise<ApiResponse<Page>> {
    const parent = parentType === 'database'
      ? { database_id: parentId }
      : { page_id: parentId };

    const body: Record<string, unknown> = {
      parent,
      properties: properties ?? {
        title: {
          title: [{ type: 'text', text: { content: title } }],
        },
      },
    };

    return this.request<Page>('POST', '/pages', body);
  }

  async updatePage(
    pageId: string,
    updates: Record<string, unknown>
  ): Promise<ApiResponse<Page>> {
    return this.request<Page>('PATCH', `/pages/${pageId}`, updates);
  }

  async archivePage(pageId: string): Promise<ApiResponse<Page>> {
    return this.updatePage(pageId, { archived: true });
  }

  // Databases
  async getDatabase(databaseId: string): Promise<ApiResponse<Database>> {
    return this.request<Database>('GET', `/databases/${databaseId}`);
  }

  async queryDatabase(
    databaseId: string,
    filter?: Record<string, unknown>,
    sorts?: unknown[],
    cursor?: string
  ): Promise<ApiResponse<PaginatedResponse<Page>>> {
    const body: Record<string, unknown> = {};
    if (filter) body.filter = filter;
    if (sorts) body.sorts = sorts;
    if (cursor) body.start_cursor = cursor;

    return this.request<PaginatedResponse<Page>>(
      'POST',
      `/databases/${databaseId}/query`,
      body
    );
  }

  // Blocks
  async getBlock(blockId: string): Promise<ApiResponse<Block>> {
    return this.request<Block>('GET', `/blocks/${blockId}`);
  }

  async getBlockChildren(
    blockId: string,
    cursor?: string
  ): Promise<ApiResponse<PaginatedResponse<Block>>> {
    const params = cursor ? `?start_cursor=${cursor}` : '';
    return this.request<PaginatedResponse<Block>>(
      'GET',
      `/blocks/${blockId}/children${params}`
    );
  }

  async appendBlocks(
    blockId: string,
    children: Block[]
  ): Promise<ApiResponse<PaginatedResponse<Block>>> {
    // Notion API limit: max 100 blocks per request
    const BATCH_SIZE = 100;
    
    if (children.length <= BATCH_SIZE) {
      return this.request<PaginatedResponse<Block>>(
        'PATCH',
        `/blocks/${blockId}/children`,
        { children }
      );
    }

    // Batch large requests (using immutable pattern)
    let allResults: Block[] = [];
    for (let i = 0; i < children.length; i += BATCH_SIZE) {
      const batch = children.slice(i, i + BATCH_SIZE);
      const result = await this.request<PaginatedResponse<Block>>(
        'PATCH',
        `/blocks/${blockId}/children`,
        { children: batch }
      );

      if (!result.success) {
        return result;
      }

      if (result.data?.results) {
        allResults = [...allResults, ...result.data.results];
      }
    }

    return {
      success: true,
      data: {
        object: 'list',
        results: allResults,
        next_cursor: null,
        has_more: false,
      },
    };
  }

  async deleteBlock(blockId: string): Promise<ApiResponse<Block>> {
    return this.request<Block>('DELETE', `/blocks/${blockId}`);
  }

  // Search
  async search(
    query?: string,
    filter?: 'page' | 'database',
    cursor?: string
  ): Promise<ApiResponse<PaginatedResponse<Page | Database>>> {
    const body: Record<string, unknown> = {};
    if (query) body.query = query;
    if (filter) body.filter = { property: 'object', value: filter };
    if (cursor) body.start_cursor = cursor;

    return this.request<PaginatedResponse<Page | Database>>('POST', '/search', body);
  }

  // Users
  async getMe(): Promise<ApiResponse<unknown>> {
    return this.request<unknown>('GET', '/users/me');
  }

  async listUsers(cursor?: string): Promise<ApiResponse<PaginatedResponse<unknown>>> {
    const params = cursor ? `?start_cursor=${cursor}` : '';
    return this.request<PaginatedResponse<unknown>>('GET', `/users${params}`);
  }
}
