import { Config } from './types/Config'

export interface SharedLibConfig {
  apiUrl: string
  debug?: boolean
}

let config: Config | null = null

export function initSharedConfig(serviceConfig: Config) {
  config = serviceConfig
}

export function getConfig(): any {
  if (!config) throw new Error('SharedLib config not initialised')
  return config
}
