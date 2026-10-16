// Matches a relative path that starts with a single "/" and contains no control characters.
// Rejects "//host", "/\\host", absolute URLs, and values like "/\t//host" that URL parsers
// normalise into protocol-relative URLs once the control character is stripped.
// eslint-disable-next-line no-control-regex
const LOCAL_PATH_REGEX = /^\/(?![/\\])(?![\s\S]*[\u0000-\u001f\u007f])/

export const isLocalPath = (url: unknown): url is string => typeof url === 'string' && LOCAL_PATH_REGEX.test(url)

export const safeRedirect = (url: unknown, fallback = '/'): string => (isLocalPath(url) ? url : fallback)
