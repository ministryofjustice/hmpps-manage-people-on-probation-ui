export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[!$%&#^/\\"<>;?*]/g, '-')
}
