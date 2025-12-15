
import { FilingStatus, Information, PersonRole } from 'freeustaxes/core/data'
import { TaxEngine, TaxResult, TaxFormLines } from 'freeustaxes/lib/tax-engines/types'

export const PA2024Engine: TaxEngine<Information, TaxResult> = {
    calculate: (info: Information): TaxResult => {
        const lines: TaxFormLines = {}
        const pa = info.pennsylvania || {}

        // --- Income Classes (L1-L8) ---

        // L1a: Gross Compensation
        // Sum of all W2 income
        const wages = info.w2s.reduce((acc, w) => acc + w.income, 0)
        lines['1a'] = wages

        // L1b: Unreimbursed Business Expenses
        lines['1b'] = pa.unreimbursedBusinessExpenses || 0

        // L1c: Net Compensation
        lines['1c'] = Math.max(0, (lines['1a'] || 0) - (lines['1b'] || 0))

        // L2: Interest
        const interest = info.f1099s
            .filter(f => f.type === 'INT')
            .reduce((acc, f: any) => acc + (f.form.income || 0), 0)
        lines['2'] = interest

        // L3: Dividends & Cap Gain Distributions
        // Note: 1099-DIV box 1a + box 2a (Cap Gain Dist) are usually taxable as Divs in PA?
        // PA Instructions: div + cap gain dists.
        const dividends = info.f1099s
            .filter(f => f.type === 'DIV')
            .reduce((acc, f: any) => acc + (f.form.dividends || 0) + (f.form.totalCapitalGainsDistributions || 0), 0)
        lines['3'] = dividends

        // L4: Net Income from Business (Sched C)
        // STRICT: Loss cannot offset other income.
        const business = info.schedule1?.additionalIncome?.businessIncome || 0
        lines['4'] = Math.max(0, business)

        // L5: Net Gain from Property Sale (Sched D)
        // STRICT: Loss cannot offset other income.
        let capGains = 0
        if (info.scheduleD) {
            info.scheduleD.transactions.forEach(t => {
                capGains += (t.proceeds - t.costBasis)
            })
        }
        // Also add other gains (Form 4797)
        capGains += (info.schedule1?.additionalIncome?.otherGains || 0)
        lines['5'] = Math.max(0, capGains)

        // L6: Net Rent/Royalty
        // STRICT: Loss cannot offset other income.
        const rental = info.schedule1?.additionalIncome?.rentalRealEstate || 0
        lines['6'] = Math.max(0, rental)

        // L7: Estate/Trust
        lines['7'] = 0 // Needs inputs

        // L8: Gambling
        const gambling = info.schedule1?.additionalIncome?.gamblingIncome || 0
        lines['8'] = Math.max(0, gambling)

        // L9: Total PA Taxable Income
        const totalTaxable =
            (lines['1c'] || 0) +
            (lines['2'] || 0) +
            (lines['3'] || 0) +
            (lines['4'] || 0) +
            (lines['5'] || 0) +
            (lines['6'] || 0) +
            (lines['7'] || 0) +
            (lines['8'] || 0)
        lines['9'] = totalTaxable

        // L10: Other Deductions
        // Usually 0 for PA (Medical/Charity not ded). 
        // Allow input override.
        lines['10'] = 0

        // L11: Adjusted PA Taxable Income
        lines['11'] = Math.max(0, totalTaxable - (lines['10'] || 0))

        // L12: Tax Current Year (3.07%)
        // Round to whole dollars usually? OTS uses doubles. 
        // PA40 instructions say round to nearest dollar for lines.
        // Tax rate 0.0307.
        lines['12'] = Math.round(lines['11'] * 0.0307)

        // --- Collections / Credits ---

        // L13: Tax Withheld
        let withheld = (pa.stateWithholding || 0)
        // Add W2 State Withholding if state matches PA? 
        // For simplicity, sum all W2 state withholding if state is PA or undefined (assume PA for PA return context).
        // Or strictly filter.
        info.w2s.forEach(w => {
            // Rough heuristic: if explicitly PA or we're running PA engine, take it.
            // Better: only if w.state === 'PA'.
            if (w.state === 'PA' || !w.state) {
                withheld += (w.stateWithholding || 0)
            }
        })
        info.f1099s.forEach(f => {
            // 1099 withholding
            // Assuming mapped to a generic field or checking specific forms
        })
        lines['13'] = withheld

        // L14-L17 Estimated payments/Credits
        // Simplified for now
        lines['18'] = 0 // Sum L14..L17

        // L21: Tax Forgiveness
        lines['21'] = pa.taxForgivenessCredit || 0

        // L22: Resident Credit
        lines['22'] = pa.residentCredit || 0

        // L23: Other Credits
        lines['23'] = pa.otherCredits || 0

        // L24: Total Payments/Credits
        lines['24'] = (lines['13'] || 0) + (lines['18'] || 0) + (lines['21'] || 0) + (lines['22'] || 0) + (lines['23'] || 0)

        // L25: Use Tax
        lines['25'] = pa.useTax || 0

        // L27: Penalties
        lines['27'] = pa.penalties || 0

        // Calc Due/Refund
        const totalLiability = (lines['12'] || 0) + (lines['25'] || 0) + (lines['27'] || 0)

        if (totalLiability > lines['24']) {
            lines['26'] = totalLiability - lines['24'] // Tax Due
            lines['28'] = lines['26'] // Total Due
            lines['29'] = 0
            lines['30'] = 0
        } else {
            lines['29'] = lines['24'] - totalLiability // Overpayment
            lines['30'] = lines['29'] // Refund
            lines['26'] = 0
            lines['28'] = 0
        }

        return { lines }
    }
}
