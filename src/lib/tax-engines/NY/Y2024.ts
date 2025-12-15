
import { FilingStatus, Information, PersonRole } from 'freeustaxes/core/data'
import { TaxEngine, TaxResult, TaxFormLines } from 'freeustaxes/lib/tax-engines/types'

// NY Standard Deductions 2024
// Source: NY IT-201 Instructions
const STANDARD_DEDUCTION = {
    [FilingStatus.S]: 8000,
    [FilingStatus.MFJ]: 16050,
    [FilingStatus.MFS]: 8000,
    [FilingStatus.HOH]: 11200,
    [FilingStatus.W]: 16050
}

export const NY2024Engine: TaxEngine<Information, TaxResult> = {
    calculate: (info: Information): TaxResult => {
        const lines: TaxFormLines = {}
        const status = info.taxPayer.filingStatus ?? FilingStatus.S
        const ny = info.newYork || {}

        // --- Federal AGI Calculation (L19) ---
        let federalAGI = 0

        // Wages (L1)
        const wages = info.w2s.reduce((acc, w) => acc + w.income, 0)
        lines['1'] = wages
        federalAGI += wages

        // Interest (L2)
        const interest = info.f1099s
            .filter(f => f.type === 'INT')
            .reduce((acc, f: any) => acc + (f.form.income || 0), 0)
        lines['2'] = interest
        federalAGI += interest

        // Dividends (L3)
        const dividends = info.f1099s
            .filter(f => f.type === 'DIV')
            .reduce((acc, f: any) => acc + (f.form.dividends || 0), 0)
        lines['3'] = dividends
        federalAGI += dividends

        // Taxable Refunds (L4)
        const taxableRefunds = info.schedule1?.additionalIncome?.taxableRefunds || 0
        federalAGI += taxableRefunds

        // Alimony (L5)
        federalAGI += (info.schedule1?.additionalIncome?.alimonyReceived || 0)

        // Business Income (L6)
        federalAGI += (info.schedule1?.additionalIncome?.businessIncome || 0)

        // Capital Gains (L7)
        let capGains = 0
        if (info.scheduleD) {
            info.scheduleD.transactions.forEach(t => {
                capGains += (t.proceeds - t.costBasis)
            })
        }
        federalAGI += capGains
        federalAGI += (info.schedule1?.additionalIncome?.otherGains || 0)

        // Pensions (L9) - 1099-R
        const pensions = info.f1099s
            .filter(f => f.type === 'R')
            .reduce((acc, f: any) => acc + (f.form.taxableAmount || 0), 0)
        federalAGI += pensions

        // Rental / Real Estate (L10)
        federalAGI += (info.schedule1?.additionalIncome?.rentalRealEstate || 0)

        // Farm Income (L11)
        federalAGI += (info.schedule1?.additionalIncome?.farmIncome || 0)

        // Unemployment (L13)
        federalAGI += (info.schedule1?.additionalIncome?.unemployment || 0)

        // Taxable SS (L14)
        let ssTaxable = 0
        if (info.schedule1?.additionalIncome?.otherIncome?.['L14']) {
            ssTaxable = info.schedule1.additionalIncome.otherIncome['L14']
        }
        federalAGI += ssTaxable

        // Other Income (L15, L16, etc from otherIncome map)
        let otherIncomeSum = 0
        if (info.schedule1?.additionalIncome?.otherIncome) {
            Object.entries(info.schedule1.additionalIncome.otherIncome).forEach(([k, v]) => {
                if (k !== 'L14') otherIncomeSum += v
            })
        }
        federalAGI += otherIncomeSum

        // Adjustments (Subtract from Income)
        let adjustments = 0
        if (info.schedule1?.adjustments?.otherAdjustments) {
            Object.values(info.schedule1.adjustments.otherAdjustments).forEach((v) => adjustments += v)
        }
        federalAGI -= adjustments

        lines['19'] = federalAGI

        // --- Additions (L20-23) ---
        lines['20'] = ny.interestNonNY || 0
        lines['21'] = ny.publicEmployeeRetirementContribs || 0
        lines['22'] = ny.ny529Distributions || 0
        lines['23'] = ny.otherAdditions || 0
        const totalAdditions = (lines['20'] ?? 0) + (lines['21'] ?? 0) + (lines['22'] ?? 0) + (lines['23'] ?? 0)

        // L24: Total Income (L19 + Additions)
        lines['24'] = federalAGI + totalAdditions

        // --- Subtractions (L25-31) ---
        lines['25'] = taxableRefunds
        lines['26'] = ny.pensionsNY || 0
        lines['27'] = ssTaxable
        lines['28'] = ny.usGovInterest || 0
        lines['29'] = ny.pensionExclusion || 0
        lines['30'] = ny.ny529Deduction || 0
        lines['31'] = ny.otherSubtractions || 0

        const totalSubtractions =
            (lines['25'] ?? 0) +
            (lines['26'] ?? 0) +
            (lines['27'] ?? 0) +
            (lines['28'] ?? 0) +
            (lines['29'] ?? 0) +
            (lines['30'] ?? 0) +
            (lines['31'] ?? 0)

        lines['32'] = totalSubtractions

        // L33: New York AGI (L24 - L32)
        const nyAGI = Math.max(0, (lines['24'] ?? 0) - totalSubtractions)
        lines['33'] = nyAGI

        // L34: Standard Deduction
        const stdDed = STANDARD_DEDUCTION[status] ?? 8000
        lines['34'] = stdDed

        // L35: Subtract Deduction
        lines['35'] = Math.max(0, nyAGI - stdDed)

        // L36: Exemptions ($1000 * Dependents)
        const exemptions = (info.taxPayer.dependents.length) * 1000
        lines['36'] = exemptions

        // L37: Taxable Income
        const taxableIncome = Math.max(0, (lines['35'] ?? 0) - exemptions)
        lines['37'] = taxableIncome

        // L39: NY State Tax
        lines['39'] = calculateNYTax(taxableIncome, status)

        // Credits / Other Taxes
        lines['40'] = ny.householdCredit || 0
        // L43: Total Nonrefundable Credits (L40 + L41(Res) + L42(Other))
        lines['43'] = (lines['40'] ?? 0) + (ny.residentCredit || 0) + (ny.otherNonRefundableCredits || 0)

        // L44: Net Tax (L39 - L43)
        lines['44'] = Math.max(0, (lines['39'] ?? 0) - (lines['43'] ?? 0))

        // L45: Other NY Taxes
        lines['45'] = ny.netOtherNYTaxes || 0

        // L46: Total NY State Taxes (L44 + L45)
        lines['46'] = (lines['44'] ?? 0) + (lines['45'] ?? 0)

        // NYC Tax (L47)
        let nycTax = 0
        if (ny.nycResident) {
            nycTax = calculateNYCTax(taxableIncome, status)
        }
        lines['47'] = nycTax

        lines['48'] = 0 // NYC Household Credit
        lines['52'] = 0 // Yonkers
        lines['59'] = ny.salesUseTax || 0
        lines['60'] = ny.voluntaryGifts || 0

        lines['61'] = (lines['46'] ?? 0) + (lines['47'] ?? 0) + (lines['52'] ?? 0) + (lines['59'] ?? 0)
        lines['62'] = (lines['61'] ?? 0) + (lines['60'] ?? 0)

        // Payments
        lines['63'] = ny.empireStateChildCredit || 0
        lines['64'] = ny.childCareCredit || 0
        lines['65'] = ny.earnedIncomeCredit || 0
        lines['67'] = ny.realPropertyCredit || 0
        lines['68'] = ny.collegeTuitionCredit || 0
        lines['71'] = ny.otherRefundableCredits || 0

        // Withholding (L72)
        let w2State = 0
        info.w2s.forEach(w => w2State += (w.stateWithholding || 0))
        info.f1099s.forEach(f => w2State += (f.form.stateTaxWithheld || 0))
        lines['72'] = w2State

        lines['73'] = ny.nycTaxWithheld || 0

        // Estimated Taxes (L75)
        let estTax = 0
        if (info.estimatedTaxes) {
            estTax = info.estimatedTaxes
                .filter(e => e.label.toUpperCase().includes('NY'))
                .reduce((acc, e) => acc + e.payment, 0)
        }
        lines['75'] = estTax

        // L76: Total Payments
        const totalPayments =
            (lines['63'] ?? 0) +
            (lines['64'] ?? 0) +
            (lines['65'] ?? 0) +
            (lines['67'] ?? 0) +
            (lines['68'] ?? 0) +
            (lines['71'] ?? 0) +
            (lines['72'] ?? 0) +
            (lines['73'] ?? 0) +
            (lines['75'] ?? 0)

        lines['76'] = totalPayments

        // Refund/Owe
        if (totalPayments > (lines['62'] ?? 0)) {
            lines['77'] = totalPayments - (lines['62'] ?? 0) // Overpaid
            lines['78'] = lines['77'] // Refund
            lines['80'] = 0
        } else {
            lines['80'] = (lines['62'] ?? 0) - totalPayments // Owe
            lines['77'] = 0
            lines['78'] = 0
        }

        return { lines }
    }
}

function calculateNYTax(income: number, status: FilingStatus): number {
    // 2024 Tax Table simulation for income < 65000 (OTS Logic)
    if (income < 65000) {
        let dx = 50
        if (income < 25) dx = 12.5
        else if (income < 50) dx = 25

        const m = Math.floor(income / dx)
        income = m * dx + 0.5 * dx
    }

    let tax = 0
    if (status === FilingStatus.MFJ || status === FilingStatus.W) {
        if (income <= 17150) tax = 0.04 * income
        else if (income <= 23600) tax = 686.0 + 0.045 * (income - 17150)
        else if (income <= 27900) tax = 976.0 + 0.0525 * (income - 23600)
        else if (income <= 161550) tax = 1202.0 + 0.0550 * (income - 27900)
        else if (income <= 323200) tax = 8553.0 + 0.0600 * (income - 161550)
        else if (income <= 2155350) tax = 18252.0 + 0.0685 * (income - 323200)
        else if (income <= 5000000) tax = 143754.0 + 0.0965 * (income - 2155350)
        else if (income <= 25000000) tax = 418263.0 + 0.103 * (income - 5000000)
        else tax = 2478263.0 + 0.109 * (income - 25000000)
    } else if (status === FilingStatus.S || status === FilingStatus.MFS) {
        if (income <= 8500) tax = 0.04 * income
        else if (income <= 11700) tax = 340.0 + 0.045 * (income - 8500)
        else if (income <= 13900) tax = 484.0 + 0.0525 * (income - 11700)
        else if (income <= 80650) tax = 600.0 + 0.0550 * (income - 13900)
        else if (income <= 215400) tax = 4271.0 + 0.0600 * (income - 80650)
        else if (income <= 1077550) tax = 12356.0 + 0.0685 * (income - 215400)
        else if (income <= 5000000) tax = 71413.0 + 0.0965 * (income - 1077550)
        else if (income <= 25000000) tax = 449929.0 + 0.103 * (income - 5000000)
        else tax = 2509929.0 + 0.109 * (income - 25000000)
    } else if (status === FilingStatus.HOH) {
        if (income <= 12800) tax = 0.04 * income
        else if (income <= 17650) tax = 512.0 + 0.045 * (income - 12800)
        else if (income <= 20900) tax = 730.0 + 0.0525 * (income - 17650)
        else if (income <= 107650) tax = 901.0 + 0.055 * (income - 20900)
        else if (income <= 269300) tax = 5672.0 + 0.06 * (income - 107650)
        else if (income <= 1616450) tax = 15371.0 + 0.0685 * (income - 269300)
        else if (income <= 5000000) tax = 107651.0 + 0.0965 * (income - 1616450)
        else if (income <= 25000000) tax = 434163.0 + 0.103 * (income - 5000000)
        else tax = 2494163.0 + 0.109 * (income - 25000000)
    }
    return Math.round(tax)
}

function calculateNYCTax(income: number, status: FilingStatus): number {
    let tax = 0
    if (status === FilingStatus.MFJ || status === FilingStatus.W) {
        if (income < 21600) tax = income * 0.03078
        else if (income < 45000) tax = (income - 21600) * 0.03762 + 665
        else if (income < 90000) tax = (income - 45000) * 0.03819 + 1545
        else tax = (income - 90000) * 0.03876 + 3264
    } else if (status === FilingStatus.S || status === FilingStatus.MFS) {
        if (income < 12000) tax = income * 0.03078
        else if (income < 25000) tax = (income - 12000) * 0.03762 + 369
        else if (income < 50000) tax = (income - 25000) * 0.03819 + 858
        else tax = (income - 50000) * 0.03876 + 1813
    } else if (status === FilingStatus.HOH) {
        if (income < 14400) tax = income * 0.03078
        else if (income < 30000) tax = (income - 14400) * 0.03762 + 443
        else if (income < 60000) tax = (income - 30000) * 0.03819 + 1030
        else tax = (income - 60000) * 0.03876 + 2176
    }
    return Math.round(tax)
}
