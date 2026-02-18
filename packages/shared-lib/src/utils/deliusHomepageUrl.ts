import { getConfig } from '../config'

export const deliusHomepageUrl = () => {
  const config = getConfig()
  return `${config.delius.link}`
}
