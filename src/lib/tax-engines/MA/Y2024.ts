
import { FilingStatus, Information, PersonRole } from 'freeustaxes/core/data'
import { TaxEngine, TaxResult, TaxFormLines } from 'freeustaxes/lib/tax-engines/types'

// MA Standard Deductions / Exemptions
const EXEMPTIONS = {
    [FilingStatus.S]: 4400,
    [FilingStatus.MFJ]: 8800,
    [FilingStatus.MFS]: 4400,
    [FilingStatus.HOH]: 6800,
    [FilingStatus.W]: 0
}

export const MA2024Engine: TaxEngine<Information, TaxResult> = {
    calculate: (info: Information): TaxResult => {
        const lines: TaxFormLines = {}
        const status = info.taxPayer.filingStatus ?? FilingStatus.S
        const ma = info.massachusetts || {}

        // L2: Exemptions
        let l2a = EXEMPTIONS[status] ?? 4400
        if (status === FilingStatus.W) l2a = 8800

        // L2b: Dependents (Number * 1000)
        const numDeps = info.taxPayer.dependents.length
        const l2b = numDeps * 1000

        // L2c: Age 65+ (Number * 700)
        let count65 = 0
        const primary = info.taxPayer.primaryPerson
        const spouse = info.taxPayer.spouse

        const is65 = (dob?: string | Date) => {
            if (!dob) return false
            const d = new Date(dob)
            return d.getFullYear() <= 1959
        }

        if (is65(primary?.dateOfBirth)) count65++
        if (spouse && is65(spouse.dateOfBirth)) count65++
        const l2c = count65 * 700

        // L2d: Blindness (Number * 2200)
        let countBlind = 0
        if (primary?.isBlind) countBlind++
        if (spouse?.isBlind) countBlind++
        const l2d = countBlind * 2200

        // L2e: Medical/Dental
        const l2e = ma.medicalDental || 0

        // L2f: Adoption
        const l2f = ma.adoption || 0

        // L2g: Total Exemptions
        const l2g = l2a + l2b + l2c + l2d + l2e + l2f
        lines['2a'] = l2a
        lines['2b'] = l2b
        lines['2c'] = l2c
        lines['2d'] = l2d
        lines['2e'] = l2e
        lines['2f'] = l2f
        lines['2g'] = l2g

        // L3: Wages
        const wages = info.w2s.reduce((acc, w) => acc + w.income, 0)
        lines['3'] = wages

        // L4: Taxable Pensions (From 1099R)
        const pensions = info.f1099s
            .filter(f => f.type === 'R' && f.form.planType !== 'IRA' && f.form.planType !== 'RothIRA')
            .reduce((acc, f: any) => acc + (f.form.taxableAmount || 0), 0)
        lines['4'] = pensions

        // L5: Interest (Mass Bank Interest)
        const interest = info.f1099s
            .filter(f => f.type === 'INT')
            .reduce((acc, f: any) => acc + (f.form.income || 0), 0)
        lines['5'] = interest

        // L6a: Business Income (Sched C)
        lines['6a'] = info.schedule1?.additionalIncome?.businessIncome || 0

        // L6b: Farm Income
        lines['6b'] = info.schedule1?.additionalIncome?.farmIncome || 0

        lines['6'] = (lines['6a'] || 0) + (lines['6b'] || 0)

        // L7: Rental/Royalty (Sched E)
        lines['7'] = info.schedule1?.additionalIncome?.rentalRealEstate || 0

        // L8: Unemployment & Lottery
        lines['8a'] = info.schedule1?.additionalIncome?.unemployment || 0
        lines['8b'] = info.schedule1?.additionalIncome?.gamblingIncome || 0
        lines['8'] = (lines['8a'] || 0) + (lines['8b'] || 0)

        // L9: Other Income, Alimony
        let l9 = info.schedule1?.additionalIncome?.alimonyReceived || 0
        lines['9'] = l9

        // L10: Total 5.0% Income
        const l10 = wages + pensions + interest + (lines['6'] ?? 0) + (lines['7'] ?? 0) + (lines['8'] ?? 0) + l9
        lines['10'] = l10

        // L11: Retirement Check deduction (FICA from W2)
        let l11_primary = 0
        let l11_spouse = 0

        info.w2s.forEach(w2 => {
            const ss = w2.ssWithholding || 0
            const med = w2.medicareWithholding || 0
            const amt = ss + med
            if (w2.personRole === PersonRole.PRIMARY) l11_primary += amt
            else if (w2.personRole === PersonRole.SPOUSE) l11_spouse += amt
            else l11_primary += amt
        })

        // Cap at 2000
        l11_primary = Math.min(l11_primary, 2000)
        l11_spouse = Math.min(l11_spouse, 2000)
        lines['11a'] = l11_primary
        lines['11b'] = l11_spouse
        lines['11'] = l11_primary + l11_spouse

        // L14: Rental Deduction
        let rentDeduction = (ma.rentPaid || 0) * 0.5
        const rentCap = (status === FilingStatus.MFS) ? 2000 : 4000
        rentDeduction = Math.min(rentDeduction, rentCap)
        lines['14'] = rentDeduction

        // L15: Other Deductions
        lines['15'] = 0

        // L16: Total Deductions
        lines['16'] = (lines['11'] ?? 0) + (lines['12'] ?? 0) + (lines['13'] ?? 0) + (lines['14'] ?? 0) + (lines['15'] ?? 0)

        // L17: Net 5% Income
        lines['17'] = Math.max(0, l10 - (lines['16'] ?? 0))

        // L18: Exemption Amount (L2g)
        lines['18'] = l2g

        // L19: 5% Income after exemptions
        lines['19'] = Math.max(0, (lines['17'] ?? 0) - l2g)

        // L20: Interest and Dividends (Sched B)
        lines['20'] = 0

        // L21: Total Taxable 5% Income
        lines['21'] = (lines['19'] ?? 0) + (lines['20'] ?? 0)

        // L22: 5% Tax
        const computeTax = (inc: number): number => {
            if (inc < 24000) {
                return Math.round(0.05 * (inc + 25.0))
            }
            return inc * 0.05
        }
        lines['22'] = computeTax(lines['21'] ?? 0)

        // L23: 12% Income
        lines['23'] = 0

        // L24: Long Term Caps
        lines['24'] = 0

        // L28: Total Tax
        const totalTax = (lines['22'] ?? 0) + (lines['23'] ?? 0) + (lines['24'] ?? 0)
        lines['28'] = totalTax

        // Credits L29, L30, L31
        const credits = (ma.limitedIncomeCredit || 0) + (ma.incomeTaxPaidToOtherJurisdictions || 0) + (ma.otherCredits || 0)
        lines['29'] = ma.limitedIncomeCredit || 0
        lines['30'] = ma.incomeTaxPaidToOtherJurisdictions || 0
        lines['31'] = ma.otherCredits || 0

        // L32: Income Tax After Credits
        lines['32'] = Math.max(0, totalTax - credits)

        // L33: Voluntary Contributions
        const voluntary = (ma.voluntaryContributions?.total || 0)
        lines['33'] = voluntary

        // L34: Use Tax
        lines['34'] = ma.useTax || 0

        // L35: Health Care Penalty
        const hc = (ma.healthCarePenalty?.primary || 0) + (ma.healthCarePenalty?.spouse || 0)
        lines['35'] = hc

        // L37: Income Tax After Credits, Contributions, Use Tax + HC
        lines['37'] = (lines['32'] ?? 0) + (lines['33'] ?? 0) + (lines['34'] ?? 0) + (lines['35'] ?? 0) + (lines['36'] ?? 0)

        // L38: Withholding
        let w2withheld = 0
        info.w2s.forEach(w => w2withheld += (w.stateWithholding || 0))
        lines['38a'] = w2withheld

        let f1099withheld = 0
        info.f1099s.forEach(f => f1099withheld += (f.form.stateTaxWithheld || 0))
        lines['38b'] = f1099withheld

        lines['38'] = w2withheld + f1099withheld

        // L43: EIC
        lines['43'] = 0

        // L48: Refundable Credits
        const refundable = (lines['43'] ?? 0)
        lines['48'] = refundable

        // L50: Total Payments
        const totalPayments = (lines['38'] ?? 0) + refundable
        lines['50'] = totalPayments

        // Refund / Owe
        if (totalPayments > (lines['37'] ?? 0)) {
            lines['51'] = totalPayments - (lines['37'] ?? 0)
            lines['53'] = lines['51']
            lines['54'] = 0
        } else {
            lines['54'] = (lines['37'] ?? 0) - totalPayments
            lines['51'] = 0
            lines['53'] = 0
        }

        return { lines }
    }
}
