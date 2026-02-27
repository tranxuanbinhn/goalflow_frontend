/**
 * Icon and Title Utilities
 * Combines icon (emoji) with title as a single string for display
 */

/**
 * Check if a character is an emoji (simple version)
 */
export function isEmoji(char: string): boolean {
  if (!char) return false;
  const code = char.codePointAt(0);
  if (!code) return false;
  
  // Check common emoji ranges
  return (
    (code >= 0x1F300 && code <= 0x1F9FF) ||  // Misc Symbols and Pictographs
    (code >= 0x2600 && code <= 0x26FF) ||     // Miscellaneous Symbols
    (code >= 0x2700 && code <= 0x27BF)         // Dingbats
  );
}

/**
 * Extract icon (emoji) from the start of a title string
 * Returns { icon: string, title: string }
 */
export function extractIconFromTitle(title: string): { icon: string; title: string } {
  if (!title || title.length === 0) {
    return { icon: '', title: '' };
  }
  
  const firstChar = title[0];
  
  if (isEmoji(firstChar)) {
    // Handle surrogate pairs for emojis outside BMP
    if (title.length > 1 && /\uD83D[\uDE00-\uDE9F]/.test(title.substring(0, 2))) {
      return { icon: title.substring(0, 2), title: title.substring(2).trim() };
    }
    return { icon: firstChar, title: title.substring(1).trim() };
  }
  
  return { icon: '', title: title };
}

/**
 * Combine icon and title into a single string
 * Format: "[ICON] [TITLE]"
 */
export function combineIconTitle(icon: string, title: string): string {
  if (!icon || !title) {
    return title || icon || '';
  }
  return `${icon} ${title}`.trim();
}

/**
 * Replace icon in an existing combined title
 */
export function replaceIconInTitle(currentTitle: string, newIcon: string): string {
  const { title } = extractIconFromTitle(currentTitle);
  return combineIconTitle(newIcon, title);
}
