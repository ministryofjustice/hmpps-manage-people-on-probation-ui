import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'
import { loadFront } from 'yaml-front-matter'
import config from '../config'

const whatsNewDir = './whats-new'

const toIsoDate = (date: Date | string): string => (date instanceof Date ? date.toISOString().slice(0, 10) : date)

const loadTechnicalUpdates = (): TechnicalUpdate[] =>
  fs
    .readdirSync(whatsNewDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const { heading, date, __content: content } = loadFront(fs.readFileSync(path.join(whatsNewDir, file), 'utf8'))
      return {
        heading: heading as string,
        date: toIsoDate(date as Date | string),
        html: marked.parse(content.replaceAll('{{guidanceUrl}}', config.guidance.link), { async: false }),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))

// Loaded once, on first use
let technicalUpdates: TechnicalUpdate[]

export default class TechnicalUpdatesService {
  getTechnicalUpdates() {
    technicalUpdates ??= loadTechnicalUpdates()
    return technicalUpdates
  }

  getLatestTechnicalUpdateHeading() {
    return this.getTechnicalUpdates()[0].heading
  }
}

export type TechnicalUpdate = {
  heading: string
  date: string
  html: string
}
