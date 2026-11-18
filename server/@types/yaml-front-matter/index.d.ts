declare module 'yaml-front-matter' {
  export function loadFront(content: string): Record<string, unknown> & { __content: string }
}
