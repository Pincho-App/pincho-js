import { describe, it, expect } from 'vitest';
import { normalizeTags } from '../src/utils.js';

describe('normalizeTags', () => {
  it('should convert tags to lowercase', () => {
    const result = normalizeTags(['Production', 'ALERT', 'Test']);
    expect(result).toEqual(['production', 'alert', 'test']);
  });

  it('should trim whitespace from tags', () => {
    const result = normalizeTags(['  production  ', ' alert ', 'test']);
    expect(result).toEqual(['production', 'alert', 'test']);
  });

  it('should remove duplicate tags', () => {
    const result = normalizeTags(['production', 'alert', 'production', 'alert']);
    expect(result).toEqual(['production', 'alert']);
  });

  it('should remove duplicates after normalization', () => {
    const result = normalizeTags(['Production', 'PRODUCTION', '  production  ']);
    expect(result).toEqual(['production']);
  });

  it('should filter out invalid characters', () => {
    const result = normalizeTags(['test@tag', 'alert!', 'prod#uction']);
    expect(result).toEqual(['testtag', 'alert', 'production']);
  });

  it('should keep valid characters (alphanumeric, hyphens, underscores)', () => {
    const result = normalizeTags(['test-tag', 'alert_1', 'prod123']);
    expect(result).toEqual(['test-tag', 'alert_1', 'prod123']);
  });

  it('should remove tags that become empty after filtering', () => {
    const result = normalizeTags(['@@@', '!!!', 'valid-tag', '###']);
    expect(result).toEqual(['valid-tag']);
  });

  it('should handle empty array', () => {
    const result = normalizeTags([]);
    expect(result).toEqual([]);
  });

  it('should handle array with empty strings', () => {
    const result = normalizeTags(['', '  ', 'valid']);
    expect(result).toEqual(['valid']);
  });

  it('should handle complex normalization scenario', () => {
    const result = normalizeTags([
      'Production',
      ' ALERT ',
      'alert',
      'test-tag',
      'Test_Tag_2',
      'invalid@tag',
      '  production  ',
      'prod#123',
    ]);
    expect(result).toEqual([
      'production',
      'alert',
      'test-tag',
      'test_tag_2',
      'invalidtag',
      'prod123',
    ]);
  });

  it('should preserve order of first occurrence', () => {
    const result = normalizeTags(['zebra', 'apple', 'zebra', 'banana']);
    expect(result).toEqual(['zebra', 'apple', 'banana']);
  });

  it('should handle tags with mixed special characters', () => {
    const result = normalizeTags(['test$%^tag', 'hello&world', 'foo*bar']);
    expect(result).toEqual(['testtag', 'helloworld', 'foobar']);
  });

  it('should handle tags with spaces in the middle', () => {
    const result = normalizeTags(['test tag', 'hello world']);
    expect(result).toEqual(['testtag', 'helloworld']);
  });

  it('should handle numeric tags', () => {
    const result = normalizeTags(['123', '456', '123']);
    expect(result).toEqual(['123', '456']);
  });

  it('should handle tags with only hyphens and underscores', () => {
    const result = normalizeTags(['test-tag-name', 'test_tag_name', 'test-tag_name']);
    expect(result).toEqual(['test-tag-name', 'test_tag_name', 'test-tag_name']);
  });
});
