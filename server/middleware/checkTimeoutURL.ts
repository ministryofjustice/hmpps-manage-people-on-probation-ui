type TimeoutUrlPath = string

interface TimeoutUrlPaths {
  urls: TimeoutUrlPath[]
}

export const timeoutUrlPaths: TimeoutUrlPaths = {
  urls: [
    '^/contact/[^/]+/enforcements$',
    '^/user/[^/]+/appointments$',
    '^/user/[^/]+$',
    '^/alerts$',
    '^/user/[^/]+/homepage$',
  ],
}

export function matchesTimeoutPath(requestPath: string, config: TimeoutUrlPaths): boolean {
  const pathname = requestPath.split('?')[0]

  return config.urls.some(pattern => new RegExp(pattern).test(pathname))
}
