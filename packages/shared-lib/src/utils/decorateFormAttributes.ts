/* eslint-disable no-param-reassign */
import { Request } from 'express'
import { getDataValue } from './getDataValue'
import { getConfig } from '../config'
import { AppResponse } from '../models/Locals'

interface Item {
  checked?: string
  selected?: string
  value: string
  text?: string
  idPrefix?: string
}

export const decorateFormAttributes = (req: Request, res: AppResponse) => (obj: any, sections?: string[]) => {
  const newObj = obj
  const config = getConfig()
  const { data } = req.session as any
  let storedValue = getDataValue(data, sections)
  if (storedValue && config.dateFields.includes(sections[sections.length - 1]) && storedValue.includes('-')) {
    const [year, month, day] = storedValue
      .split('-')
      .map((value: string) => (value.startsWith('0') ? value.substring(1) : value))
    storedValue = [day, month, year].join('/')
  }
  if (newObj.items !== undefined) {
    newObj.items = newObj.items.map((item: Item) => {
      if (typeof item.value === 'undefined') {
        item.value = item.text
      }
      if (storedValue) {
        if (
          (Array.isArray(storedValue) && storedValue.includes(item?.value?.toString())) ||
          storedValue === item?.value?.toString()
        ) {
          if (storedValue.indexOf(item.value) !== -1) {
            item.checked = 'checked'
            item.selected = 'selected'
          }
        }
      }
      return item
    })
    if (sections?.length) {
      newObj.idPrefix = sections.join('-')
    }
  } else {
    newObj.value = storedValue
  }
  if (sections?.length) {
    const id = sections.join('-')
    if (typeof newObj.id === 'undefined') {
      newObj.id = id
    }
    newObj.name = sections.map((s: string) => `[${s}]`).join('')
    if (res?.locals?.errorMessages?.[id]) {
      newObj.errorMessage = { text: res.locals.errorMessages[id] }
    }
  }

  return newObj
}
