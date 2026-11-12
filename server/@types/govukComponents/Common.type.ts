// Options shared across the GOV.UK Nunjucks macros

// HTML attributes (for example data attributes) to add to an element
export type Attributes = Record<string, string>

// One of text or html is required. If html is provided, text is ignored
export type TextOrHtml = { text: string; html?: string } | { text?: string; html: string }
