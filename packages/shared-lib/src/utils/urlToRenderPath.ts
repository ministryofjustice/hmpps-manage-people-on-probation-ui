import { Request, Response } from 'express'

export function urlToRenderPath(req: Request, res: Response): string {
  const url = req.originalUrl || req.url

  return (
    res?.locals?.renderPath ??
    `pages/${[
      url
        .split('?')[0]
        .split('/')
        .filter(Boolean)
        .filter((_segment: any, index: number) => ![0, 1, 3].includes(index))
        .join('/'),
    ]}`
  )
}
