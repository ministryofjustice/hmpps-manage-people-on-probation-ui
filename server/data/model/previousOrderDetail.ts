import { Sentence } from './sentenceDetails'
import { Name } from './personalDetails'

export interface PreviousOrderDetail {
  name: Name
  title: string
  sentence: Sentence
}
