import fs from 'fs'
import path from 'path'
import { getConfig } from './config'

export type ApplicationInfo = {
  applicationName: string
  version?: string
  buildNumber: string
  gitRef: string
  gitShortHash: string
  productId?: string
  branchName: string
}

export default (): ApplicationInfo => {
  const config = getConfig()
  const { buildNumber, gitRef, productId, branchName } = config
  const packageJson = path.join(__dirname, '../package.json')
  const { name: applicationName, version } = JSON.parse(fs.readFileSync(packageJson).toString())
  return { applicationName, version, buildNumber, gitRef, gitShortHash: gitRef.substring(0, 7), productId, branchName }
}
