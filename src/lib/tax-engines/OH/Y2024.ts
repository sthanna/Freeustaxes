
import { FilingStatus, Information, PersonRole } from 'freeustaxes/core/data'
import { TaxEngine, TaxResult, TaxFormLines } from 'freeustaxes/lib/tax-engines/types'

export const OH2024Engine: TaxEngine<Information, TaxResult> = {
    calculate: (info: Information): TaxResult => {
        const lines: TaxFormLines = {}
        const oh = info.ohio || {}

        // L1: Fed AGI
        const fedAGI = info.w2s.reduce((acc, w) => acc + w.income, 0) +
            info.f1099s.reduce((acc, f: any) => acc + (f.form.income || 0) + (f.form.dividends || 0) + (f.form.taxableAmount || 0), 0) +
            (info.schedule1?.additionalIncome?.businessIncome || 0) +
            (info.schedule1?.additionalIncome?.rentalRealEstate || 0) +
            (info.schedule1?.additionalIncome?.otherGains || 0) +
            (info.schedule1?.additionalIncome?.farmIncome || 0) +
            (info.schedule1?.additionalIncome?.unemployment || 0) +
            (info.schedule1?.additionalIncome?.taxableRefunds || 0) +
            (info.schedule1?.additionalIncome?.alimonyReceived || 0) +
            (info.schedule1?.additionalIncome?.otherIncome ? Object.values(info.schedule1.additionalIncome.otherIncome).reduce((a, b) => a + b, 0) : 0) +
            (info.scheduleD?.transactions.reduce((acc, t) => acc + (t.proceeds - t.costBasis), 0) || 0)
        lines['1'] = fedAGI

        // Sched A Additions (Summed)
        // L2a
        lines['2a'] = oh.additions || 0

        // Sched A Deductions (Summed)
        // L2b
        lines['2b'] = oh.deductions || 0

        // L3: Ohio AGI
        // L1 + L2a - L2b
        lines['3'] = (lines['1'] || 0) + (lines['2a'] || 0) - (lines['2b'] || 0)

        // L4: Exemptions
        // Exemptions count: Self + Spouse + Dependents
        const status = info.taxPayer.filingStatus ?? FilingStatus.S
        let exemptionCount = 1 // Self
        if (status === FilingStatus.MFJ || status === FilingStatus.W) exemptionCount++ // Spouse
        exemptionCount += info.taxPayer.dependents.length

        if (oh.exemptions !== undefined) exemptionCount = oh.exemptions

        // Exemption Amount per unit
        const ohAGI = lines['3'] || 0
        let exemptionAmount = 0
        if (ohAGI <= 40000) exemptionAmount = 2400
        else if (ohAGI <= 80000) exemptionAmount = 2150
        else exemptionAmount = 1900

        lines['4'] = exemptionCount * exemptionAmount

        // L5: Ohio Taxable Income
        lines['5'] = Math.max(0, (lines['3'] || 0) - (lines['4'] || 0))

        // L6: Taxable Business Income (Input)
        // L7: Taxable Non-Business Income (L5 - L6)
        // L8a: Non-Business Income Tax Liability
        // We will simplify and assume L5 is the base for tax for now unless business income is explicitly separated. 
        // OTS example has L6 input. We'll verify against a simpler non-business case first or assume all is non-business if not provided.
        // Let's assume typical case L6=0 for now or implement full logic if inputs exist.
        // OTS code: L7 = NotLessThanZero( L5 - L6 ); L8a = TaxRateFunction( L7 );
        // We probably need L6 input if we want to match correct handling.
        // For now, let's treat L5 as the base for tax.

        // L8a: Tax calculation on L5 (assuming no business income split for MVP)
        lines['8a'] = calculateOHTax(lines['5'] || 0)

        // L8b: Business Income Tax Liability (Input)
        lines['8b'] = 0 // Needs input if we support it.

        // L8c: Total Tax
        lines['8c'] = (lines['8a'] || 0) + (lines['8b'] || 0)

        // L9: Non-refundable credits (Sched C)
        // Includes Joint Filing Credit logic if applicable
        // OTS Logic: 
        // 1. Calculate JFC if MFJ and qualify.
        // 2. Add other credits.
        let credits = oh.taxCredits || 0
        if (status === FilingStatus.MFJ && oh.jointFilingCredit) {
            // JFC Logic
            // If OH Taxable Income (L5? OTS uses L5 for bracket but "qualifying Ohio adjusted gross income" for eligibility. 
            // OTS code: if (L[5] < 25000) jfc = 0.20... based on L5 (Taxable Income) actually? Code uses L[5].
            const taxable = lines['5'] || 0
            let jfcRate = 0
            if (taxable < 25000) jfcRate = 0.20
            else if (taxable < 50000) jfcRate = 0.15
            else if (taxable < 75000) jfcRate = 0.10
            else jfcRate = 0.05

            // JFC is based on Tax Liability (L8c) after certain other credits?
            // OTS: SchedC[12] = smallerof( jfc * SchedC[11], 650.0 );
            // SchedC[11] is tax after exemption credits.
            // Simplified: apply to L8c.
            const jfcAmount = Math.min((lines['8c'] || 0) * jfcRate, 650)
            credits += jfcAmount
        }

        lines['9'] = credits

        // L10: Tax Liability after non-refundable credits
        lines['10'] = Math.max(0, (lines['8c'] || 0) - (lines['9'] || 0))

        // L11: Interest Penalty
        lines['11'] = 0

        // L12: Use Tax
        lines['12'] = oh.useTax || 0

        // L13: Total Liability
        lines['13'] = (lines['10'] || 0) + (lines['11'] || 0) + (lines['12'] || 0)

        // --- Payments ---
        // L14: Withholding
        let withheld = oh.stateWithholding || 0
        info.w2s.forEach(w => {
            if (w.state === 'OH') withheld += (w.stateWithholding || 0)
        })
        lines['14'] = withheld

        // L15: Estimated
        lines['15'] = oh.estimatedTaxPayments || 0

        // L16: Refundable Credits (if any)
        lines['16'] = 0

        // L18: Total Payments (L14+L15+L16+L17)
        lines['18'] = (lines['14'] || 0) + (lines['15'] || 0) + (lines['16'] || 0)

        // L19: Overpayment prev (0)
        lines['19'] = 0

        // L20: Net Payments
        lines['20'] = (lines['18'] || 0) - (lines['19'] || 0)

        // Due/Refund
        // If L13 >= L20 -> Due
        // Else Refund
        if ((lines['13'] || 0) >= (lines['20'] || 0)) {
            lines['23'] = (lines['13'] || 0) - (lines['20'] || 0) // Amount Due
            lines['24'] = 0 // Overpayment
            lines['27'] = 0 // Refund
        } else {
            lines['23'] = 0
            lines['24'] = (lines['20'] || 0) - (lines['13'] || 0) // Overpayment
            lines['27'] = lines['24'] // Refund (assuming no donation)
        }

        return { lines }
    }
}

function calculateOHTax(income: number): number {
    // 2024 OH Tax Brackets
    // <= 26050: 0
    // <= 100000: 360.69 + 2.75% of excess > 26050
    // > 100000: 2394.32 + 3.5% of excess > 100000

    if (income <= 26050) return 0
    if (income <= 100000) {
        return 360.69 + (income - 26050) * 0.0275
    }
    return 2394.32 + (income - 100000) * 0.035
}
