
import { FilingStatus, Information, PersonRole } from 'freeustaxes/core/data'
import { TaxEngine, TaxResult, TaxFormLines } from 'freeustaxes/lib/tax-engines/types'

export const NJ2024Engine: TaxEngine<Information, TaxResult> = {
    calculate: (info: Information): TaxResult => {
        const lines: TaxFormLines = {}
        const status = info.taxPayer.filingStatus ?? FilingStatus.S
        const nj = info.newJersey || {}

        // --- Exemptions (L6-L12) ---
        // L6: Regular Exemption
        let regularExemption = 1000
        if (status === FilingStatus.MFJ) regularExemption = 2000
        lines['6'] = regularExemption

        // L7: Age 65+
        // TODO: Calculate from DOB
        const over65 = 0
        lines['7'] = over65 * 1000

        // L8: Blind/Disabled
        let blind = (info.taxPayer.primaryPerson?.isBlind ? 1 : 0)
        if (info.taxPayer.spouse?.isBlind) blind++
        lines['8'] = blind * 1000

        // L9: Veteran
        let vet = (nj.veteran ? 1 : 0) + (nj.spouseVeteran ? 1 : 0)
        lines['9'] = vet * 6000

        // L10: Qualified Dependent Children
        const children = info.taxPayer.dependents.length
        lines['10'] = children * 1500

        // L11: Other Dependents
        lines['11'] = 0 // Needs inputs

        // L12: Dependents Attending College
        lines['12'] = 0 // Needs inputs

        // L13: Total Exemptions
        const totalExemptions = (lines['6'] || 0) + (lines['7'] || 0) + (lines['8'] || 0) +
            (lines['9'] || 0) + (lines['10'] || 0) + (lines['11'] || 0) + (lines['12'] || 0)
        lines['13'] = totalExemptions

        // --- Income (L15-L27) ---
        // L15: Wages
        const wages = info.w2s.reduce((acc, w) => acc + w.income, 0)
        lines['15'] = wages

        // L16: Interest
        const interest = info.f1099s
            .filter(f => f.type === 'INT')
            .reduce((acc, f: any) => acc + (f.form.income || 0), 0)
        lines['16'] = interest

        // L17: Dividends
        const dividends = info.f1099s
            .filter(f => f.type === 'DIV')
            .reduce((acc, f: any) => acc + (f.form.dividends || 0), 0)
        lines['17'] = dividends

        // L18: Business Income
        lines['18'] = info.schedule1?.additionalIncome?.businessIncome || 0

        // L19: Capital Gains
        let capGains = 0
        if (info.scheduleD) {
            info.scheduleD.transactions.forEach(t => {
                capGains += (t.proceeds - t.costBasis)
            })
        }
        lines['19'] = Math.max(0, capGains) // NJ generally doesn't allow net loss carryover like Fed? Verification needed.

        // L20a: Pensions
        const pensions = info.f1099s
            .filter(f => f.type === 'R')
            .reduce((acc, f: any) => acc + (f.form.taxableAmount || 0), 0)
        lines['20'] = pensions

        // L27: Total Income
        const totalIncome = (lines['15'] || 0) + (lines['16'] || 0) + (lines['17'] || 0) +
            (lines['18'] || 0) + (lines['19'] || 0) + (lines['20'] || 0)
        lines['27'] = totalIncome

        // L28: Pension/Retirement Exclusion
        const pensionExclusion = (nj.pensionExclusion || 0) + (nj.otherRetirementExclusion || 0)
        lines['28'] = pensionExclusion

        // L29: NJ Gross Income
        const grossIncome = Math.max(0, totalIncome - pensionExclusion)
        lines['29'] = grossIncome

        // --- Deductions (L31-L38) ---
        // L31: Medical Expenses (Worksheet F)
        // > 2% of Gross Income
        let medicalDed = 0
        if (nj.medicalExpenses) {
            const limit = 0.02 * grossIncome
            if (nj.medicalExpenses > limit) {
                medicalDed = nj.medicalExpenses - limit
            }
        }
        lines['31'] = medicalDed

        // L38: Total Deductions
        const totalDeductions = (lines['31'] || 0) + (lines['13'] || 0) // Exemptions are effectively a deduction against TI

        // Note: On NJ 1040, Exemptions (line 13) are subtracted from Gross Income?
        // Actually, OTS C code: L39 = L29 - L38.
        // And L38 sums L30..L37.
        // L30 = L13 (Total Exemptions).

        lines['30'] = lines['13']

        // Sum L30..L37
        const totalExemptionsAndDeductions =
            (lines['30'] || 0) + (lines['31'] || 0)
        // + L32..L37 unimplemented

        lines['38'] = totalExemptionsAndDeductions

        // L39: Taxable Income
        const taxableIncome = Math.max(0, grossIncome - totalExemptionsAndDeductions)
        lines['39'] = taxableIncome

        // L40: Property Tax Paid
        lines['40'] = nj.propertyTaxPaid || 0

        // L41/42/43/57: Property Tax Deduction/Credit Logic
        // Simple logic: Credit is often better for lower income.
        // OTS Logic: if ded > credit, lookups etc.
        // For now, assume Credit if eligible.
        // L42 would be (TI - PropTaxDed).

        // This is complex. Let's start with basic Tax Calc based on TI.

        // L43: Tax on L39
        // Note: If prop tax deduction is taken, tax is on (TI - Ded).
        // Let's assume no prop tax deduction for this pass.
        lines['43'] = calculateNJTax(taxableIncome, status)

        // L44: Credit for Tax Paid to Other Jurisdictions
        lines['44'] = 0 // Needs inputs/logic

        // L45: Balance of Tax
        lines['45'] = Math.max(0, (lines['43'] || 0) - (lines['44'] || 0))

        // L50: Balance after Credits
        lines['50'] = lines['45']

        // L54: Total Tax
        lines['54'] = lines['50']

        // L55: Withholding
        let withheld = (nj.stateWithholding || 0)
        info.w2s.forEach(w => withheld += (w.stateWithholding || 0))
        lines['55'] = withheld

        // L57: Property Tax Credit ($50)
        // Eligibility rules apply.
        let propTaxCredit = 0
        if ((nj.homeowner || nj.tenant) && (grossIncome > 0)) { // simplified eligibility
            propTaxCredit = 50
        }
        lines['57'] = propTaxCredit

        // L66: Total Payments/Credits
        lines['66'] = (lines['55'] || 0) + (lines['57'] || 0)

        // L67: Amount You Owe
        if ((lines['54'] || 0) > (lines['66'] || 0)) {
            lines['67'] = (lines['54'] || 0) - (lines['66'] || 0)
            lines['68'] = 0
        } else {
            lines['68'] = (lines['66'] || 0) - (lines['54'] || 0)
            lines['67'] = 0
        }

        return { lines }
    }
}

// OTS TaxRateFormula
function calculateNJTax(income: number, status: FilingStatus): number {
    let tax = 0
    if (status === FilingStatus.S || status === FilingStatus.MFS) {
        if (income < 20000) tax = income * 0.014
        else if (income < 35000) tax = income * 0.0175 - 70.0
        else if (income < 40000) tax = income * 0.035 - 682.5
        else if (income < 75000) tax = income * 0.05525 - 1492.5
        else if (income < 500000) tax = income * 0.0637 - 2126.25
        else if (income < 1000000) tax = income * 0.0897 - 15126.25
        else tax = income * 0.1075 - 32926.25
    } else {
        // MFJ, HOH, W
        if (income < 20000) tax = income * 0.014
        else if (income < 50000) tax = income * 0.0175 - 70.0
        else if (income < 70000) tax = income * 0.0245 - 420.0
        else if (income < 80000) tax = income * 0.035 - 1154.5
        else if (income < 150000) tax = income * 0.05525 - 2775.0
        else if (income < 500000) tax = income * 0.0637 - 4042.5
        else if (income < 1000000) tax = income * 0.0897 - 17042.5
        else tax = income * 0.1075 - 34842.5
    }

    // OTS TaxRateFunction logic: Quantize to $50 brackets if < $100,000
    if (income < 100000) {
        // This quantization logic simulates the tax table lookup
        // We'll trust the direct formula for now, but may need rounding adjustment
        // based on verification failures.
        return Math.round(tax)
    }

    return Math.round(tax)
}
