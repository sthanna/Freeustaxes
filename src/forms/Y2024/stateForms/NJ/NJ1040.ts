import Form, { FormMethods } from 'freeustaxes/core/stateForms/Form'
import F1040 from '../../irsForms/F1040'
import { Field } from 'freeustaxes/core/pdfFiller'
import { State, FilingStatus } from 'freeustaxes/core/data'
import { NJ_TAX_BRACKETS, NJ_EXEMPTION, NJ_DEPENDENT_EXEMPTION } from './data'

export default class NJ1040 extends Form {
    info: F1040['info']
    f1040: F1040
    formName = 'NJ-1040'
    state: State = 'NJ'
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

    // Wages (Line 14)
    l14 = (): number | undefined => this.f1040.l1z()

    // Taxable Interest (Line 15)
    l15 = (): number | undefined => this.f1040.l2b()

    // Dividends (Line 16)
    l16 = (): number | undefined => this.f1040.l3b()

    // Gross Income (Line 29) - Simplified
    l29 = (): number => {
        return (this.l14() ?? 0) + (this.l15() ?? 0) + (this.l16() ?? 0)
    }

    // Exemptions (Line 30)
    l30 = (): number => {
        let exemptions = NJ_EXEMPTION // Taxpayer
        if (this.info.taxPayer.filingStatus === FilingStatus.MFJ) {
            exemptions += NJ_EXEMPTION // Spouse
        }
        exemptions += this.info.taxPayer.dependents.length * NJ_DEPENDENT_EXEMPTION
        return exemptions
    }

    // Taxable Income (Line 39)
    l39 = (): number => Math.max(0, this.l29() - this.l30())

    // Tax (Line 42)
    l42 = (): number => {
        const taxable = this.l39()
        const brackets = NJ_TAX_BRACKETS[this.info.taxPayer.filingStatus]
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
            this.l14(),
            this.l15(),
            this.l16(),
            this.l29(),
            this.l30(),
            this.l39(),
            this.l42()
        ]
    }
}
