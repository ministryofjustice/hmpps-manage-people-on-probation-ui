/* eslint-disable no-param-reassign */
import { Request } from 'express'
import { getDataValue } from './getDataValue'
import config from '../config'
import { AppResponse } from '../models/Locals'

interface Item {
  checked?: string
  selected?: string
  value: string
  text?: string
  idPrefix?: string
}

export const decorateFormAttributes = (req: Request, res: AppResponse) => (obj: any, sections?: string[]) => {
  const newObj = { ...obj }
  const { data } = req.session as any
  let storedValue = getDataValue(data, sections) || getDataValue(req.body, sections)
  if (storedValue && config.dateFields.includes(sections![sections!.length - 1]) && storedValue.includes('-')) {
    const [year, month, day] = storedValue
      .split('-')
      .map((value: string) => (value.startsWith('0') ? value.substring(1) : value))
    storedValue = [day, month, year].join('/')
  }
  console.log('***** sections storedValue ***********')
  console.log({
    sections,
    storedValue,
  })
  console.log('*******req.session.data*********')
  console.dir(req.session.data, { depth: null })
  console.log('****************')

  if (newObj.items !== undefined) {
    newObj.items = newObj.items.map((item: Item) => {
      const newItem = { ...item }
      if (typeof newItem.value === 'undefined') {
        newItem.value = newItem.text!
      }
      if (storedValue) {
        if (
          (Array.isArray(storedValue) && storedValue.includes(newItem?.value?.toString())) ||
          storedValue === newItem?.value?.toString()
        ) {
          newItem.checked = 'checked'
          newItem.selected = 'selected'
        }
      }
      return newItem
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
