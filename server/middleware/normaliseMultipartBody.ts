/* eslint-disable no-useless-escape */
/* eslint-disable no-plusplus */
/* eslint-disable no-continue */
import { NextFunction } from 'express'
import { AppResponse } from '../models/Locals'

type NestedObject = {
  [key: string]: any
}

export const normaliseMultipartBody = (body: Record<string, string>): Record<string, string> => {
  const result: NestedObject = {}

  for (const key of Object.keys(body)) {
    const value = body[key]

    // Direct assignment for _csrf or non-bracketed keys
    if (!key.startsWith('[')) {
      result[key] = value
      continue
    }

    // Match all bracketed segments: [appointments][X778160][UUID][type]
    const pathMatches = [...key.matchAll(/\[([^\[\]]+)\]/g)]
    const path = pathMatches.map(m => m[1])

    if (path.length === 0) continue

    // Walk and build the nested structure
    let current: NestedObject = result
    for (let i = 0; i < path.length; i++) {
      const part = path[i]
      const isLast = i === path.length - 1

      if (isLast) {
        current[part] = value
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
        current = current[part]
      }
    }
  }
  return result
}
