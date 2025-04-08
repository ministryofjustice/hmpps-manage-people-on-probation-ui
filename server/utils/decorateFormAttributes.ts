/* eslint-disable no-param-reassign */
import { Request } from 'express'
import { AppResponse } from '../@types'
import { getDataValue } from './getDataValue'
import config from '../config'

interface Item {
  checked?: string
  selected?: string
  value: string
  text?: string
  idPrefix?: string
}

export const decorateFormAttributes = (req: Request, res: AppResponse) => (obj: any, sections?: string[]) => {
  const newObj = obj
  const { data } = req.session as any
  let storedValue = getDataValue(data, sections)
  if (storedValue && config.dateFields.includes(sections[sections.length - 1]) && storedValue.includes('-')) {
    const [year, month, day] = storedValue.split('-')
    storedValue = [day.padStart(2, '0'), month.padStart(2, '0'), year].join('/')
  }
  if (newObj.items !== undefined) {
    newObj.items = newObj.items.map((item: Item) => {
      if (typeof item.value === 'undefined') {
        item.value = item.text
      }
      if (storedValue) {
        if ((Array.isArray(storedValue) && storedValue.includes(item.value)) || storedValue === item.value) {
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
    if (res?.locals?.errors?.errorMessages?.[id]?.text) {
      newObj.errorMessage = { text: res.locals.errors.errorMessages[id].text }
    }
  }
  return newObj
}
