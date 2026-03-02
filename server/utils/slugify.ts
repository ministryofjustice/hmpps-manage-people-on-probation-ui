/**
 * Helper to convert a description into a URL-friendly slug
 * e.g., "Police Liaison" -> "police-liaison"
 */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
