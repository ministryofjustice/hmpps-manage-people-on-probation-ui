export interface Note {
  id: number
  createdBy?: string
  createdByDate?: string
  note: string
  hasNotesBeenTruncated?: boolean
}
