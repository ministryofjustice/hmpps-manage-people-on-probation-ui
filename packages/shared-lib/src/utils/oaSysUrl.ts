import { getConfig } from '../config'

export const oaSysUrl = () => {
  const config = getConfig()
  return `${config.oaSys.link}`
}
