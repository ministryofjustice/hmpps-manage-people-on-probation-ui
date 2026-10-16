// Matches a relative path that starts with a single "/" (rejects "//host", "/\host" and absolute URLs)
const LOCAL_PATH_REGEX = /^\/(?![/\\])/

export const isLocalPath = (url: unknown): url is string => typeof url === 'string' && LOCAL_PATH_REGEX.test(url)

export const safeRedirect = (url: unknown, fallback = '/'): string => (isLocalPath(url) ? url : fallback)
