import fs from 'fs'

const technicalUpdates = JSON.parse(fs.readFileSync('./technicalUpdates.json').toString()) as TechnicalUpdate[]

export default class TechnicalUpdatesService {
  getTechnicalUpdates() {
    return technicalUpdates
  }

  getLatestTechnicalUpdateHeading() {
    return technicalUpdates[0].heading
  }
}

export type TechnicalUpdate = {
  heading: string
  summary: string
  whatsNew: string[]
  technicalFixes?: string[]
}
