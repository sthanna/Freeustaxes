import F1040Attachment from './F1040Attachment'
import { Field } from 'freeustaxes/core/pdfFiller'
import { FormTag } from 'freeustaxes/core/irsForms/Form'

/**
 * TODO: Credit for child and dependent care expenses
 */
export default class F2441 extends F1040Attachment {
  tag: FormTag = 'f2441'
  sequenceIndex = 999

  credit = (): number | undefined => undefined

  fields = (): Field[] => []
}
