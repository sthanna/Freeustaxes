
import {
    FilingStatus,
    Information,
    PersonRole,
    Income1099Type
} from 'freeustaxes/core/data'
import { PA2024Engine } from '../Y2024'

// Mock Data based on PA_40_2024_example.txt
// Status: Married/Joint
// Income:
// L1a: 29812.34 (Primary) + 21609.09 (Spouse) = 51421.43
// L1b: 0
// L2: 34.56 + 17.83 = 52.39
// L3: 143.65 + 29.32 = 172.97
// L4: -345 (Loss) -> 0
// L5: 23
// L6: -1092 (Loss) -> 0
// L7: 0
// L8: 0
// Total Taxable (L9): 51421.43 + 52.39 + 172.97 + 0 + 23 + 0 = 51669.79
// L10: 0
// L11: 51669.79
// L12 Tax: 51669.79 * 0.0307 = 1586.26 (Round to 1586?)
// Withheld: 813.67 + 724.12 = 1537.79

const mockInfo: any = {
    taxPayer: {
        primaryPerson: {
            firstName: 'Samual',
            lastName: 'Watson',
            ssid: '123-45-6789',
            role: PersonRole.PRIMARY,
            isBlind: false,
            dateOfBirth: '1980-01-01',
            address: {
                address: '123 Homestead Lane',
                city: 'Wilksberry Acers',
                state: 'PA',
                zip: '19207'
            },
            isTaxpayerDependent: false
        },
        filingStatus: FilingStatus.MFJ,
        dependents: [],
        spouse: {
            firstName: 'Maria',
            lastName: 'Watson',
            ssid: '987-65-4321',
            role: PersonRole.SPOUSE,
            isBlind: false,
            dateOfBirth: '1982-01-01',
            isTaxpayerDependent: false
        }
    },
    w2s: [
        {
            income: 29812.34,
            fedWithholding: 0,
            ssWages: 0,
            ssWithholding: 0,
            medicareIncome: 0,
            medicareWithholding: 0,
            state: 'PA',
            stateWages: 29812.34,
            stateWithholding: 813.67,
            occupation: 'Waitor',
            personRole: PersonRole.PRIMARY
        },
        {
            income: 21609.09,
            fedWithholding: 0,
            ssWages: 0,
            ssWithholding: 0,
            medicareIncome: 0,
            medicareWithholding: 0,
            state: 'PA',
            stateWages: 21609.09,
            stateWithholding: 724.12,
            occupation: 'Welder',
            personRole: PersonRole.SPOUSE
        }
    ],
    f1099s: [
        {
            type: Income1099Type.INT,
            payer: 'Bank 1',
            form: { income: 34.56 },
            personRole: PersonRole.PRIMARY
        },
        {
            type: Income1099Type.INT,
            payer: 'Bank 2',
            form: { income: 17.83 },
            personRole: PersonRole.SPOUSE
        },
        {
            type: Income1099Type.DIV,
            payer: 'Broker 1',
            form: {
                dividends: 143.65,
                qualifiedDividends: 0,
                totalCapitalGainsDistributions: 0
            },
            personRole: PersonRole.PRIMARY
        },
        {
            type: Income1099Type.DIV,
            payer: 'Broker 2',
            form: {
                dividends: 29.32,
                qualifiedDividends: 0,
                totalCapitalGainsDistributions: 0
            },
            personRole: PersonRole.SPOUSE
        }
    ],
    schedule1: {
        additionalIncome: {
            businessIncome: -345, // L4 Loss
            rentalRealEstate: -1092, // L6 Loss
            otherGains: 23 // L5 Gain (Net Gain from Property Disposition)
        }
    },
    scheduleD: {
        transactions: []
    },
    pennsylvania: {
        unreimbursedBusinessExpenses: 0
    },
    questions: {},
    stateResidencies: [{ state: 'PA' }],
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

describe('PA 2024 Tax Engine', () => {
    it('calculates tax correctly for OTS example', () => {
        const result = PA2024Engine.calculate(mockInfo as any)
        const l = result.lines

        console.log('PA Lines:', JSON.stringify(l, null, 2))

        // L1a: Wages
        expect(l['1a']).toBeCloseTo(51421.43, 2)

        // L1c: Net Comp
        expect(l['1c']).toBeCloseTo(51421.43, 2)

        // L2: Interest
        expect(l['2']).toBeCloseTo(52.39, 2)

        // L3: Dividends
        expect(l['3']).toBeCloseTo(172.97, 2)

        // L4: Business (Loss restricted to 0)
        expect(l['4']).toBe(0)

        // L5: Cap Gains
        expect(l['5']).toBe(23)

        // L6: Rents (Loss restricted to 0)
        expect(l['6']).toBe(0)

        // L9: Total Taxable
        // 51421.43 + 52.39 + 172.97 + 0 + 23 + 0 = 51669.79
        expect(l['9']).toBeCloseTo(51669.79, 2)

        // L11: Adjusted Taxable
        expect(l['11']).toBeCloseTo(51669.79, 2)

        // L12: Tax (3.07%)
        // 51669.79 * 0.0307 = 1586.262553
        // Round to 1586.
        expect(l['12']).toBe(1586)

        // L13: Withheld
        // 813.67 + 724.12 = 1537.79
        expect(l['13']).toBeCloseTo(1537.79, 2)

        // L26: Tax Due
        // 1586 - 1537.79 = 48.21.
        // Rounding differences might apply if lines are integer based.
        // OTS example output not fully seen for L26, but let's check basic math.
        // If engine lines 24/26 use floats, we expect ~48.21.
        expect(l['26']).toBeCloseTo(48.21, 1)
    })
})
