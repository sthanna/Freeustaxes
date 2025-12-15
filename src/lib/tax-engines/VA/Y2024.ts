
import { FilingStatus, Information, PersonRole } from 'freeustaxes/core/data'
import { TaxEngine, TaxResult, TaxFormLines } from 'freeustaxes/lib/tax-engines/types'

export const VA2024Engine: TaxEngine<Information, TaxResult> = {
    calculate: (info: Information): TaxResult => {
        const lines: TaxFormLines = {}
        const va = info.virginia || {}

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

        // L2: Additions
        lines['2'] = va.additions || 0

        // L3: L1 + L2
        lines['3'] = (lines['1'] || 0) + (lines['2'] || 0)

        // Subtractions
        // L4: Age Deduction (Manual calc or input?). 2024: Born before 1960.
        // Simplified: use input or 0 for now unless age is derived.
        // 2024 Age Deduction: If born <= Jan 1, 1960 -> $12k max (needs income check).
        // OTS example has input L4=30. We'll use input if provided, or 0.
        // We'll rely on user entering the calculated Age Deduction for MVP since complexity is high (income limits).
        lines['4'] = 0

        // L5: SS / Tier 1 RR
        // Should parse from 1099-SSA if available. For now, 0 or derive if implemented.
        lines['5'] = 0

        // L6: State Refund (from Fed Sched 1 taxable refunds)
        lines['6'] = info.schedule1?.additionalIncome?.taxableRefunds || 0

        // L7: Other Subtractions
        lines['7'] = va.subtractions || 0

        // L8: Total Subtractions
        lines['8'] = (lines['4'] || 0) + (lines['5'] || 0) + (lines['6'] || 0) + (lines['7'] || 0)

        // L9: VA AGI (L3 - L8)
        lines['9'] = (lines['3'] || 0) - (lines['8'] || 0)

        // L10: Itemized Deductions (Override)
        lines['10'] = 0 // If user itemizes on Fed, they can here. Assume std for MVP unless input.

        // L11: Standard Deduction
        // Single: 8500, MFJ/W: 17000, MFS: 8500
        const status = info.taxPayer.filingStatus ?? FilingStatus.S
        let stdDed = 0
        if (status === FilingStatus.MFJ || status === FilingStatus.W) stdDed = 17000
        else stdDed = 8500

        // Use Std Ded if L10 is 0
        if ((lines['10'] || 0) === 0) {
            lines['11'] = stdDed
        } else {
            lines['11'] = 0
        }

        // L12: Exemptions
        // Personal/Dep: $930
        // Senior/Blind: $800
        let exCountA = 1 // Self
        if (status === FilingStatus.MFJ || status === FilingStatus.W) exCountA++
        exCountA += info.taxPayer.dependents.length

        if (va.exemptionsCount !== undefined) {
            // If override provided, assume it applies to total dollar value or just count A?
            // OTS input "OtherDependents" implies count.
            // Let's calculate standard check first.
        }

        const exAmtA = exCountA * 930

        // Exemption B (Age/Blind)
        let exCountB = 0
        if (info.taxPayer.primaryPerson?.isBlind) exCountB++

        const getYear = (d: any): number => {
            if (!d) return 2000
            if (d instanceof Date) return d.getFullYear()
            return parseInt(d.split('-')[0])
        }

        const birthYear = getYear(info.taxPayer.primaryPerson?.dateOfBirth)
        if (birthYear < 1960) exCountB++

        if (status === FilingStatus.MFJ && info.taxPayer.spouse) {
            if (info.taxPayer.spouse.isBlind) exCountB++
            const spouseYear = getYear(info.taxPayer.spouse.dateOfBirth)
            if (spouseYear < 1960) exCountB++
        }

        const exAmtB = exCountB * 800

        lines['12'] = exAmtA + exAmtB

        // L13: Mortgage Ded / Other (Input)
        lines['13'] = 0

        // L14: Total Deductions
        lines['14'] = (lines['10'] || 0) + (lines['11'] || 0) + (lines['12'] || 0) + (lines['13'] || 0)

        // L15: Taxable Income
        lines['15'] = Math.max(0, (lines['9'] || 0) - (lines['14'] || 0))

        // L16: Tax
        lines['16'] = calculateVATax(lines['15'] || 0)

        // L17: Spouse Tax Adjustment (Input)
        // Calculating this requires knowing Spouse's share of VAGI.
        // Ideally this is a separate engine run or detailed input.
        lines['17'] = va.spouseTaxAdjustment || 0

        // L18: Net Tax
        lines['18'] = Math.max(0, (lines['16'] || 0) - (lines['17'] || 0))

        // Payments / Credits
        // L19a: Withholding
        let withheld = va.stateWithholding || 0
        info.w2s.forEach(w => {
            if (w.state === 'VA') withheld += (w.stateWithholding || 0)
        })
        lines['19a'] = withheld
        lines['19b'] = 0 // Spouse withholding, summed into 19a for simplification or could be separate if we track spouse W2s precisely.
        // Actually engine loop sums all W2s, so 19a covers spouse if W2s are there.
        // OTS has 19a and 19b but sums them later in calc logic often.

        // L20: Estimated
        lines['20'] = va.estimatedTaxPayments || 0

        // L21: Applied Overpayment
        lines['21'] = 0

        // L22: Extension
        lines['22'] = va.extensionPayments || 0

        // L23: Low Income Credit
        lines['23'] = va.lowIncomeCredit || 0

        // L24: Other State Credit
        lines['24'] = va.creditForTaxPaidToOtherState || 0

        // L25: Credits from CR
        lines['25'] = va.otherCredits || 0

        // L26: Total Payments/Credits
        lines['26'] = (lines['19a'] || 0) + (lines['20'] || 0) + (lines['21'] || 0) + (lines['22'] || 0) +
            (lines['23'] || 0) + (lines['24'] || 0) + (lines['25'] || 0)

        // L27: Tax You Owe
        // L28: Overpayment
        if ((lines['26'] || 0) < (lines['18'] || 0)) {
            lines['27'] = (lines['18'] || 0) - (lines['26'] || 0)
            lines['28'] = 0
        } else {
            lines['27'] = 0
            lines['28'] = (lines['26'] || 0) - (lines['18'] || 0)
        }

        // L33: Use Tax
        lines['33'] = va.useTax || 0

        // L35: Amount Due (L27 + L33)
        if (lines['27'] > 0 || lines['33'] > 0) {
            lines['35'] = (lines['27'] || 0) + (lines['33'] || 0)
        }

        // L36: Refund (L28 - L33)
        if (lines['28'] > 0) {
            const refund = (lines['28'] || 0) - (lines['33'] || 0)
            if (refund >= 0) {
                lines['36'] = refund
            } else {
                lines['35'] = Math.abs(refund) // Owe difference
                lines['36'] = 0
            }
        }

        return { lines }
    }
}

function calculateVATax(income: number): number {
    // VA Tax Brackets
    // < 3000: 2%
    // < 5000: 60 + 3% > 3000
    // < 17000: 120 + 5% > 5000
    // >= 17000: 720 + 5.75% > 17000

    if (income < 3000) return income * 0.02
    if (income < 5000) return 60 + (income - 3000) * 0.03
    if (income < 17000) return 120 + (income - 5000) * 0.05
    return 720 + (income - 17000) * 0.0575
}
