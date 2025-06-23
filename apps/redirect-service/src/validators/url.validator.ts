/**
 * Validates a shortId string for the redirect service.
 * Throws an error if the shortId is invalid.
 * @param shortId - The shortId to validate.
 */
export function validateShortId(shortId: string): void {
  if (!shortId || typeof shortId !== 'string' || shortId.length === 0 || shortId.length > 20) {
    throw new Error('Invalid short URL format.');
  }
} 