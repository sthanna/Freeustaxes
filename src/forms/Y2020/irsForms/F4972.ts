import F1040Attachment from './F1040Attachment'
import { Field } from 'freeustaxes/core/pdfFiller'
import { FormTag } from 'freeustaxes/core/irsForms/Form'

/**
 * Not implemented yet
 */
export default class F4972 extends F1040Attachment {
  tag: FormTag = 'f4972'
  sequenceIndex = 999

  tax = (): number => 0

  fields = (): Field[] => []
}
