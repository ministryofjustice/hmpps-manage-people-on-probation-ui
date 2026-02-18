import fs from 'fs'
import path from 'path'

export default class TechnicalUpdatesService {
  private technicalUpdates: TechnicalUpdate[] = []

  readTechnicalUpdates() {
    const technicalUpdatesPath = path.join(__dirname, 'technicalUpdates.json')
    this.technicalUpdates = JSON.parse(fs.readFileSync(technicalUpdatesPath, 'utf-8')) as TechnicalUpdate[]
  }

  getTechnicalUpdates() {
    this.readTechnicalUpdates()
    return this.technicalUpdates
  }

  getLatestTechnicalUpdateHeading() {
    this.readTechnicalUpdates()
    return this.technicalUpdates[0].heading
  }
}

export type TechnicalUpdate = {
  heading: string
  summary: string
  whatsNew: string[]
  technicalFixes?: string[]
}
