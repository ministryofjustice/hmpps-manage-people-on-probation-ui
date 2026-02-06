import { getDataValue } from './getDataValue'
import { setDataValue } from './setDataValue'

interface Props<DataT, ItemT> {
  data: DataT
  path: string[]
  key?: keyof ItemT
  find?: string
  replace?: string
}

export const findReplace = <DataT, ItemT>({ data, path, key, find, replace }: Props<DataT, ItemT>): DataT => {
  const replaceTerm = (str: string) => {
    if (str.includes(find)) {
      return str.split(find).join(replace)
    }
    return str
  }
  const newData: DataT = data
  const node = getDataValue<ItemT[] | string>(data, path)
  if (node) {
    if (Array.isArray(node)) {
      setDataValue(
        newData,
        path[0],
        (node as ItemT[]).map(item => {
          return {
            ...item,
            [key]: replaceTerm(item[key] as string),
          }
        }),
      )
    } else {
      setDataValue(newData, path, replaceTerm(node))
    }
  }
  return newData
}
