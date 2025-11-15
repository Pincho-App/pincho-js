/**
 * Normalize tags by:
 * - Converting to lowercase
 * - Trimming whitespace
 * - Removing duplicates
 * - Filtering out invalid characters (only allow alphanumeric, hyphens, underscores)
 *
 * @param tags - Array of tags to normalize
 * @returns Normalized array of unique, valid tags
 *
 * @example
 * ```typescript
 * normalizeTags(['Production', ' ALERT ', 'alert', 'test-tag', 'invalid@tag'])
 * // Returns: ['production', 'alert', 'test-tag']
 * ```
 */
export function normalizeTags(tags: string[]): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  const normalized = tags
    .map((tag) => {
      // Convert to lowercase and trim
      const cleaned = tag.toLowerCase().trim();

      // Remove invalid characters (keep only alphanumeric, hyphens, underscores)
      return cleaned.replace(/[^a-z0-9\-_]/g, '');
    })
    .filter((tag) => tag.length > 0); // Remove empty strings

  // Remove duplicates using Set
  return [...new Set(normalized)];
}
