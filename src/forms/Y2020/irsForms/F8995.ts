import F1040Attachment from './F1040Attachment'
import { Field } from 'freeustaxes/core/pdfFiller'
import { FormTag } from 'freeustaxes/core/irsForms/Form'

/**
 * Not implemented
 */
export default class F8995 extends F1040Attachment {
  tag: FormTag = 'f8995'
  sequenceIndex = 999

  deductions = (): number => 0

  fields = (): Field[] => []
}
