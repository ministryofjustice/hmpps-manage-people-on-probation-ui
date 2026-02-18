export interface SharedLibConfig {
  apiUrl: string
  debug?: boolean
}

let config: SharedLibConfig | null = null

export function initSharedConfig(userConfig: SharedLibConfig) {
  config = userConfig
}

export function getConfig(): any {
  if (!config) throw new Error('SharedLib config not initialised')
  return config
}
