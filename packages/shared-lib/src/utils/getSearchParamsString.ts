import { Request } from 'express'

export const getSearchParamsString = ({
  req,
  ignore = [],
  prefix = '?',
  showPrefixIfNoQuery = false,
  suffix = '',
}: {
  req: Request
  ignore?: string[]
  prefix?: string
  showPrefixIfNoQuery?: boolean
  suffix?: string
}): string => {
  const query = req.query as Record<string, string>
  if (!Object.keys(query).length) {
    return showPrefixIfNoQuery ? `${prefix}` : ''
  }
  const params = Object.entries(query).filter(([key, value]) => !ignore.includes(key) && value)
  if (!params.length) {
    return showPrefixIfNoQuery ? `${prefix}` : ''
  }
  const searchParams = params
    .reduce((acc, [key, value]) => {
      return [...acc, `${key}=${value}`]
    }, [] as any)
    .join('&')
  return `${prefix}${searchParams}${suffix}`
}
