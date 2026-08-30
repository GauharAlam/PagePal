/**
 * Sanitize user-provided content before sending to AI providers.
 * Strips HTML, script tags, and potential prompt injection patterns.
 */
export function sanitizeContent(text) {
  if (!text || typeof text !== 'string') return '';

  let clean = text
    // Remove HTML tags
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    // Remove HTML entities
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&#\d+;/g, ' ')
    // Remove potential prompt injection markers
    .replace(/\[SYSTEM\]/gi, '[SYS]')
    .replace(/\[INST\]/gi, '[INS]')
    .replace(/<\|im_start\|>/gi, '')
    .replace(/<\|im_end\|>/gi, '')
    .replace(/<\|endoftext\|>/gi, '')
    // Collapse excessive whitespace
    .replace(/\s{4,}/g, '   ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

  return clean;
}

/**
 * Sanitize a title string — more restrictive than content.
 */
export function sanitizeTitle(title) {
  if (!title || typeof title !== 'string') return '';
  return title
    .replace(/<[^>]+>/g, '')
    .replace(/[<>"'`]/g, '')
    .slice(0, 500)
    .trim();
}

/**
 * Sanitize a URL string.
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href.slice(0, 2000);
  } catch {
    return '';
  }
}
