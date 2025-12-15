import F1040Attachment from './F1040Attachment'
import { Field } from 'freeustaxes/core/pdfFiller'
import { FormTag } from 'freeustaxes/core/irsForms/Form'

/**
 * TODO: not implemented
 * Referenced Schedule 3 line 13a
 */
export default class F2439 extends F1040Attachment {
  tag: FormTag = 'f2439'
  sequenceIndex = 999

  credit = (): number | undefined => undefined

  fields = (): Field[] => []
}
