
import {
    FilingStatus,
    Information,
    PersonRole,
    Income1099Type
} from 'freeustaxes/core/data'
import { NC2024Engine } from '../Y2024'

// Mock Data based on NC_400_2024_example.txt
// Status: Married/Joint
// Income:
// L6 (Fed AGI): Not explicitly detailed in example lines, but "FedReturn" points to US_1040_example.
// US_1040_Example typically has Wages ~51k.
// Let's reverse engineer from expected results or use standard mock.
// Example L13 (Ratio) = 1.
// L15 (Tax) = 4.5% of L14.
// L18 (Use Tax) = 91.23.
// L20a+b = 1500 + 700 = 2200.
// Let's use the standard "Simulated" income from previous tests ~51k to test the flow.
// If we assume Fed AGI = 51421 (from previous OTS examples).
// L10a (Children) = 0 in example.
// L11 (Std Ded) = 0 in example input -> implies use Std if 0? 
// Code says: "Enter 0 to use Std Deduction".
// NC Std Ded MFJ = 25500.
// Taxable (L14) = 51421 - 25500 = 25921.
// Tax (L15) = 25921 * 0.045 = 1166.445 -> 1166.
// Net Tax = 1166.
// Total Alloc = 1166 + 91.23 = 1257.23.
// Paid = 2200.
// Refund = 2200 - 1257.23 = 942.77.
// Let's verify this logic follows.

const mockInfo: any = {
    taxPayer: {
        primaryPerson: {
            firstName: 'Sarah',
            lastName: 'Parks',
            ssid: '123-45-6789',
            role: PersonRole.PRIMARY,
            isBlind: false,
            dateOfBirth: '1980-01-01',
            address: {
                address: '321 Calabasas Rd.',
                city: 'Raleigh',
                state: 'NC',
                zip: '27695'
            },
            isTaxpayerDependent: false
        },
        filingStatus: FilingStatus.MFJ,
        dependents: [], // L10a = 0
        spouse: {
            firstName: 'Sam',
            lastName: 'Parks',
            ssid: '987-65-4321',
            role: PersonRole.SPOUSE,
            isBlind: false,
            dateOfBirth: '1982-01-01',
            isTaxpayerDependent: false
        }
    },
    w2s: [
        {
            income: 51421, // Simulating Fed AGI
            fedWithholding: 0,
            ssWages: 0,
            ssWithholding: 0,
            medicareIncome: 0,
            medicareWithholding: 0,
            state: 'NC',
            stateWages: 51421,
            stateWithholding: 1500.00,
            occupation: 'Worker',
            personRole: PersonRole.PRIMARY
        },
        {
            income: 0,
            fedWithholding: 0,
            ssWages: 0,
            ssWithholding: 0,
            medicareIncome: 0,
            medicareWithholding: 0,
            state: 'NC',
            stateWages: 0,
            stateWithholding: 700.00,
            occupation: 'Spouse',
            personRole: PersonRole.SPOUSE
        }
    ],
    f1099s: [],
    schedule1: {},
    scheduleD: { transactions: [] },
    northCarolina: {
        additions: 0,
        deductions: 0,
        childDeductionCount: 0,
        taxCredits: 0,
        useTax: 91.23,
        estimatedTaxPayments: 0,
        residentStatus: 'Full-Year'
    },
    questions: {},
    stateResidencies: [{ state: 'NC' }],
    realEstate: [],
    estimatedTaxes: [],
    f1098es: [],
    f3921s: [],
    scheduleK1Form1065s: [],
    itemizedDeductions: undefined,
    credits: [],
    healthSavingsAccounts: [],
    individualRetirementArrangements: []
}

describe('NC 2024 Tax Engine', () => {
    it('calculates tax correctly for inferred OTS example', () => {
        const result = NC2024Engine.calculate(mockInfo as any)
        const l = result.lines

        console.log('NC Lines:', JSON.stringify(l, null, 2))

        // L6: Fed AGI
        expect(l['6']).toBe(51421)

        // L11: Std Deduction (MFJ)
        expect(l['11']).toBe(25500)

        // L12a: Total Ded
        expect(l['12a']).toBe(25500)

        // L12/L14: Taxable Income
        // 51421 - 25500 = 25921
        expect(l['14']).toBe(25921)

        // L15: Tax (4.5%)
        // 25921 * 0.045 = 1166.445 -> Round to 1166
        expect(l['15']).toBe(1166)

        // L19: Total Liability
        // 1166 + 91.23 = 1257.23
        expect(l['19']).toBeCloseTo(1257.23, 2)

        // L20: Withholding
        // 1500 + 700 = 2200
        expect(l['20']).toBe(2200)

        // L34: Refund
        // 2200 - 1257.23 = 942.77
        expect(l['34']).toBeCloseTo(942.77, 2)
    })
})
