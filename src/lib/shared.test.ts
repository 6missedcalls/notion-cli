/**
 * Tests for CLI shared utilities
 * Following TDD: Tests written first, covering all utility functions
 */

import { describe, it, expect } from 'vitest';
import { normalizeId, formatId, validateUrl, validateFilePath } from '../cli/shared.js';

describe('normalizeId', () => {
  describe('valid IDs', () => {
    it('should accept a 32-character hex string without hyphens', () => {
      const id = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
      expect(normalizeId(id)).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    });

    it('should remove hyphens from UUID format', () => {
      const uuid = 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6';
      expect(normalizeId(uuid)).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    });

    it('should extract ID from Notion page URL', () => {
      const url = 'https://www.notion.so/workspace/Page-Title-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
      expect(normalizeId(url)).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    });

    it('should extract ID from Notion database URL', () => {
      const url = 'https://notion.so/a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6?v=xyz';
      expect(normalizeId(url)).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    });

    it('should handle uppercase hex characters', () => {
      const id = 'A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6';
      expect(normalizeId(id)).toBe('A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6');
    });

    it('should handle mixed case hex characters', () => {
      const id = 'A1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6';
      expect(normalizeId(id)).toBe('A1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6');
    });
  });

  describe('invalid IDs', () => {
    it('should throw for empty string', () => {
      expect(() => normalizeId('')).toThrow('Invalid Notion ID format');
    });

    it('should throw for ID with invalid characters', () => {
      expect(() => normalizeId('g1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6')).toThrow('Invalid Notion ID format');
    });

    it('should throw for ID that is too short', () => {
      expect(() => normalizeId('a1b2c3d4')).toThrow('Invalid Notion ID format');
    });

    it('should extract first 32 chars from longer hex string (URL extraction behavior)', () => {
      // The function extracts 32-char hex patterns from URLs, so a longer hex string
      // will have its first 32 characters extracted
      expect(normalizeId('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8')).toBe('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    });

    it('should throw for random text', () => {
      expect(() => normalizeId('not-a-valid-id')).toThrow('Invalid Notion ID format');
    });
  });
});

describe('formatId', () => {
  it('should add hyphens to 32-character hex string in UUID format', () => {
    const id = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
    expect(formatId(id)).toBe('a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6');
  });

  it('should handle ID that already has hyphens', () => {
    const id = 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6';
    expect(formatId(id)).toBe('a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6');
  });

  it('should return original if not 32 characters after cleaning', () => {
    const id = 'short-id';
    expect(formatId(id)).toBe('short-id');
  });

  it('should handle empty string', () => {
    expect(formatId('')).toBe('');
  });
});

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should accept https URL', () => {
      const url = 'https://example.com/image.png';
      expect(validateUrl(url)).toBe(url);
    });

    it('should accept http URL', () => {
      const url = 'http://example.com/image.png';
      expect(validateUrl(url)).toBe(url);
    });

    it('should accept URL with query parameters', () => {
      const url = 'https://example.com/image.png?size=large&format=webp';
      expect(validateUrl(url)).toBe(url);
    });

    it('should accept URL with port', () => {
      const url = 'https://example.com:8080/image.png';
      expect(validateUrl(url)).toBe(url);
    });

    it('should accept URL with authentication', () => {
      const url = 'https://user:pass@example.com/image.png';
      expect(validateUrl(url)).toBe(url);
    });
  });

  describe('invalid URLs', () => {
    it('should throw for ftp protocol', () => {
      expect(() => validateUrl('ftp://example.com/file.txt')).toThrow('protocol');
    });

    it('should throw for file protocol', () => {
      expect(() => validateUrl('file:///etc/passwd')).toThrow('protocol');
    });

    it('should throw for javascript protocol', () => {
      expect(() => validateUrl('javascript:alert(1)')).toThrow('protocol');
    });

    it('should throw for invalid URL format', () => {
      expect(() => validateUrl('not-a-url')).toThrow('Invalid URL format');
    });

    it('should throw for empty string', () => {
      expect(() => validateUrl('')).toThrow('Invalid URL format');
    });
  });

  describe('custom allowed protocols', () => {
    it('should accept custom protocols when specified', () => {
      const url = 'ftp://example.com/file.txt';
      expect(validateUrl(url, ['ftp:'])).toBe(url);
    });

    it('should reject http when only https is allowed', () => {
      expect(() => validateUrl('http://example.com', ['https:'])).toThrow('protocol');
    });
  });
});

describe('validateFilePath', () => {
  describe('valid paths', () => {
    it('should accept simple filename', () => {
      expect(validateFilePath('file.json')).toBe('file.json');
    });

    it('should accept relative path', () => {
      expect(validateFilePath('./data/file.json')).toBe('./data/file.json');
    });

    it('should accept absolute path', () => {
      expect(validateFilePath('/home/user/file.json')).toBe('/home/user/file.json');
    });

    it('should accept path with spaces', () => {
      expect(validateFilePath('path with spaces/file.json')).toBe('path with spaces/file.json');
    });

    it('should accept parent directory traversal (allowed for CLI)', () => {
      expect(validateFilePath('../parent/file.json')).toBe('../parent/file.json');
    });
  });

  describe('invalid paths', () => {
    it('should throw for path with null bytes', () => {
      expect(() => validateFilePath('file\0.json')).toThrow('null bytes');
    });

    it('should throw for path with null byte in middle', () => {
      expect(() => validateFilePath('/path/to\0/file')).toThrow('null bytes');
    });
  });
});
