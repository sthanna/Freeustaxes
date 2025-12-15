
import { FilingStatus, Information, PersonRole } from 'freeustaxes/core/data'
import { TaxEngine, TaxResult, TaxFormLines } from 'freeustaxes/lib/tax-engines/types'

export const NC2024Engine: TaxEngine<Information, TaxResult> = {
    calculate: (info: Information): TaxResult => {
        const lines: TaxFormLines = {}
        const nc = info.northCarolina || {}

        // Fed AGI Approx (L6)
        const fedAGI = info.w2s.reduce((acc, w) => acc + w.income, 0) +
            info.f1099s.reduce((acc, f: any) => acc + (f.form.income || 0) + (f.form.dividends || 0) + (f.form.taxableAmount || 0), 0) +
            (info.schedule1?.additionalIncome?.businessIncome || 0) +
            (info.schedule1?.additionalIncome?.rentalRealEstate || 0) +
            (info.schedule1?.additionalIncome?.otherGains || 0) +
            (info.schedule1?.additionalIncome?.farmIncome || 0) +
            (info.schedule1?.additionalIncome?.unemployment || 0) +
            (info.schedule1?.additionalIncome?.taxableRefunds || 0) +
            (info.schedule1?.additionalIncome?.alimonyReceived || 0) +
            (info.schedule1?.additionalIncome?.otherIncome ? Object.values(info.schedule1.additionalIncome.otherIncome).reduce((a: number, b: number) => a + b, 0) : 0) +
            (info.scheduleD?.transactions.reduce((acc, t) => acc + (t.proceeds - t.costBasis), 0) || 0)
        lines['6'] = fedAGI

        // L7: Additions
        lines['7'] = nc.additions || 0

        // L8: L6 + L7
        lines['8'] = (lines['6'] || 0) + (lines['7'] || 0)

        // L9: Deductions
        lines['9'] = nc.deductions || 0

        // L10: Child Deduction
        // L10a: Count
        const childCount = nc.childDeductionCount !== undefined ? nc.childDeductionCount : info.taxPayer.dependents.length
        // Logic should verify dependency status (age, etc). OTS assumes input or simple logic.
        // OTS Child Deduction Table (simplified)
        // Dependent on Adjusted Gross Income (L6)
        const agi = lines['6'] || 0
        const status = info.taxPayer.filingStatus ?? FilingStatus.S
        const dedAmount = getChildDeductionAmount(agi, status)
        lines['10'] = childCount * dedAmount

        // L11: Standard Deduction or Itemized (Choice)
        // NC 2024 Standard Deductions:
        // S/MFS: 12,750
        // MFJ/W: 25,500
        // HOH: 19,125
        let stdDed = 0
        if (status === FilingStatus.S || status === FilingStatus.MFS) stdDed = 12750
        else if (status === FilingStatus.MFJ || status === FilingStatus.W) stdDed = 25500
        else if (status === FilingStatus.HOH) stdDed = 19125

        // Use greater of std or itemized logic if we had itemized input. Default to std.
        lines['11'] = stdDed

        // L12a: Total Deductions (L9 + L10 + L11)
        lines['12a'] = (lines['9'] || 0) + (lines['10'] || 0) + (lines['11'] || 0)

        // L12: NC Taxable Income Before Part-Year (L8 - L12a)
        lines['12'] = Math.max(0, (lines['8'] || 0) - (lines['12a'] || 0))

        // L13: NC Taxable Income (Part Year ratio)
        // Default to 1.0 (Full Year)
        lines['13'] = 1.0

        // L14: NC Taxable Income
        lines['14'] = lines['12'] * lines['13'] // Assuming L13 is ratio. OTS code: L14 = L13 * L12. If L13 is 1.0 for resident.

        // L15: NC Tax 4.5%
        lines['15'] = Math.round(lines['14'] * 0.045)

        // L16: Tax Credits
        lines['16'] = nc.taxCredits || 0

        // L17: Net Tax
        lines['17'] = Math.max(0, lines['15'] - lines['16'])

        // L18: Use Tax
        lines['18'] = nc.useTax || 0

        // L19: Total Tax Liability
        lines['19'] = lines['17'] + lines['18']

        // --- Payments ---
        // L20: Withholding
        let withheld = (nc.stateWithholding || 0)
        info.w2s.forEach(w => {
            if (w.state === 'NC') withheld += (w.stateWithholding || 0)
        })
        // Add Spouse L20b logic if needed (summed here)
        lines['20'] = withheld

        // L21: Estimated / Other
        lines['21'] = nc.estimatedTaxPayments || 0

        // L22: Amended Return Payment (0)
        lines['22'] = 0

        // L23: Total Payments
        lines['23'] = lines['20'] + lines['21'] + lines['22']

        // L25: Net Payments (L23 - L24(PrevRefund))
        lines['25'] = lines['23']

        // Due/Refund
        if (lines['19'] > lines['25']) {
            lines['26'] = lines['19'] - lines['25'] // Due
            lines['34'] = 0
        } else {
            lines['34'] = lines['25'] - lines['19'] // Refund
            lines['26'] = 0
        }

        return { lines }
    }
}

function getChildDeductionAmount(agi: number, status: FilingStatus): number {
    // NC 2024 Child Deduction Table (OTS Logic)
    if (status === FilingStatus.MFJ || status === FilingStatus.W) {
        if (agi <= 40000) return 3000
        if (agi <= 60000) return 2500
        if (agi <= 80000) return 2000
        if (agi <= 100000) return 1500
        if (agi <= 120000) return 1000
        if (agi <= 140000) return 500
        return 0
    } else if (status === FilingStatus.HOH) {
        if (agi <= 30000) return 3000
        if (agi <= 45000) return 2500
        if (agi <= 60000) return 2000
        if (agi <= 75000) return 1500
        if (agi <= 90000) return 1000
        if (agi <= 105000) return 500
        return 0
    } else { // Single / MFS
        if (agi <= 20000) return 3000
        if (agi <= 30000) return 2500
        if (agi <= 40000) return 2000
        if (agi <= 50000) return 1500
        if (agi <= 60000) return 1000
        if (agi <= 70000) return 500
        return 0
    }
}
