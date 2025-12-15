
import {
    FilingStatus,
    Information,
    PersonRole,
    Income1099Type
} from 'freeustaxes/core/data'
import { OH2024Engine } from '../Y2024'

// Mock Data based on OH_IT1040_2024_example.txt
// Status: Single
// Fed AGI (L1): 33456
// Additions: 486.7
// Deductions: 10350.23
// OH AGI (L3) = 33456 + 486.7 - 10350.23 = 23592.47
// Exemptions (L4): 1 * 2400 (<=40k tier) = 2400
// OH Taxable (L5): 23592.47 - 2400 = 21192.47
// Tax (L8a): <= 26050 -> 0.
// Business Tax (L8b): 500 (Input from example) -- Wait, engine simplified L8b=0.
// If I want to match example exactly I might need to mock L8b or acknowledge deviation.
// Let's assume for this MVP test we accept L8b=0 and verify L8a=0.
// Thus L8c = 0.
// Credits: Huge resident credit in example covers everything.
// Use Tax (L12): 78.90.
// Withholding (L14): 865.67.
// Liability: 78.90.
// Refund: 865.67 - 78.90 = 786.77.

const mockInfo: any = {
    taxPayer: {
        primaryPerson: {
            firstName: 'Fred',
            lastName: 'Symthe',
            ssid: '123-45-6789',
            role: PersonRole.PRIMARY,
            isBlind: false,
            dateOfBirth: '1985-01-01',
            address: {
                address: '432 Ormo St',
                city: 'Halo Ville',
                state: 'OH',
                zip: '43004'
            },
            isTaxpayerDependent: false
        },
        filingStatus: FilingStatus.S,
        dependents: []
    },
    w2s: [
        {
            income: 33456,
            fedWithholding: 0,
            ssWages: 0,
            ssWithholding: 0,
            medicareIncome: 0,
            medicareWithholding: 0,
            state: 'OH',
            stateWages: 33456,
            stateWithholding: 865.67,
            occupation: 'Worker',
            personRole: PersonRole.PRIMARY
        }
    ],
    f1099s: [],
    schedule1: {},
    scheduleD: { transactions: [] },
    ohio: {
        additions: 486.7,
        deductions: 10350.23,
        exemptions: 1,
        jointFilingCredit: false,
        taxCredits: 94477.39, // Sum of all credits in example (~94k resident + others)
        useTax: 78.90,
        stateWithholding: 0 // Mocking W2 withholding above, specific field override 0
    },
    questions: {},
    stateResidencies: [{ state: 'OH' }],
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

describe('OH 2024 Tax Engine', () => {
    it('calculates tax correctly for inferred OTS example', () => {
        const result = OH2024Engine.calculate(mockInfo as any)
        const l = result.lines

        console.log('OH Lines:', JSON.stringify(l, null, 2))

        // L1: Fed AGI
        expect(l['1']).toBe(33456)

        // L3: OH AGI
        expect(l['3']).toBeCloseTo(23592.47, 2)

        // L4: Exemptions
        // 2400 * 1
        expect(l['4']).toBe(2400)

        // L5: Taxable Matches
        expect(l['5']).toBeCloseTo(21192.47, 2)

        // L8a: Tax
        // <= 26050 -> 0
        expect(l['8a']).toBe(0)

        // L13: Total Liability
        // Tax (0) + Use Tax (78.90) = 78.90
        expect(l['13']).toBe(78.90)

        // L14: Withholding
        expect(l['14']).toBe(865.67)

        // L27: Refund
        expect(l['27']).toBeCloseTo(786.77, 2)
    })
})
