import Form, { FormMethods } from 'freeustaxes/core/stateForms/Form'
import F1040 from '../../irsForms/F1040'
import { Field } from 'freeustaxes/core/pdfFiller'
import { State } from 'freeustaxes/core/data'
import { sumFields } from 'freeustaxes/core/irsForms/util'
import { NY_TAX_BRACKETS, NY_STANDARD_DEDUCTION, NY_DEPENDENT_EXEMPTION } from './data'

export default class IT201 extends Form {
  info: F1040['info']
  f1040: F1040
  formName = 'IT-201'
  state: State = 'NY'
  formOrder = 0
  methods: FormMethods

  constructor(f1040: F1040) {
    super()
    this.info = f1040.info
    this.f1040 = f1040
    this.methods = new FormMethods(this)
  }

  attachments = (): Form[] => {
    return []
  }

  // Federal AGI
  l19 = (): number | undefined => this.f1040.l11()

  // NY Additions (Placeholder)
  l20 = (): number | undefined => undefined
  l21 = (): number | undefined => undefined
  l22 = (): number | undefined => undefined
  l23 = (): number | undefined => sumFields([this.l20(), this.l21(), this.l22()])

  // Line 24: Federal AGI + Additions
  l24 = (): number => (this.l19() ?? 0) + (this.l23() ?? 0)

  // NY Subtractions (Placeholder)
  l25 = (): number | undefined => undefined
  l27 = (): number | undefined => this.f1040.l6b() // Social Security benefits
  l32 = (): number | undefined => sumFields([this.l25(), this.l27()])

  // NY AGI
  l33 = (): number => Math.max(0, this.l24() - (this.l32() ?? 0))

  // Standard Deduction
  l34 = (): number => NY_STANDARD_DEDUCTION[this.info.taxPayer.filingStatus]

  // Dependent Exemptions (Line 36)
  l36 = (): number => this.info.taxPayer.dependents.length * NY_DEPENDENT_EXEMPTION

  // Taxable Income
  l37 = (): number => Math.max(0, this.l33() - this.l34() - this.l36())

  // Tax Calculation
  l39 = (): number => {
    const taxable = this.l37()
    const brackets = NY_TAX_BRACKETS[this.info.taxPayer.filingStatus]
    let tax = 0
    let previousLimit = 0

    for (const bracket of brackets) {
      if (taxable > previousLimit) {
        const taxableAmount = Math.min(taxable, bracket.limit) - previousLimit
        tax += taxableAmount * bracket.rate
        previousLimit = bracket.limit
      } else {
        break
      }
    }
    return tax
  }

  fields = (): Field[] => {
    return [
      this.l19(),
      this.l23(),
      this.l24(),
      this.l32(),
      this.l33(),
      this.l34(),
      this.l36(),
      this.l37(),
      this.l39()
    ]
  }
}
