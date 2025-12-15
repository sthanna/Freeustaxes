
import {
    FilingStatus,
    Information,
    PersonRole,
    Income1099Type,
    PlanType1099
} from 'freeustaxes/core/data'
import { NJ2024Engine } from '../Y2024'

// Mock Data based on NJ_1040_2024_example.txt
// Status: Married/Joint
// Income: Wages ($48k), Interest, Div, CapGains
// Exemptions: Regular, Senior, Vet
// Deductions: Medical, Property Tax
const mockInfo: any = {
    taxPayer: {
        primaryPerson: {
            firstName: 'Fred',
            lastName: 'Flintstone',
            ssid: '123-45-6789',
            role: PersonRole.PRIMARY,
            isBlind: false,
            dateOfBirth: '1960-01-01',
            address: {
                address: '123 Bedrock Blvd',
                city: 'Bedrock',
                state: 'NJ',
                zip: '07000'
            },
            isTaxpayerDependent: false
        },
        filingStatus: FilingStatus.MFJ,
        dependents: [],
        spouse: {
            firstName: 'Wilma',
            lastName: 'Flintstone',
            ssid: '987-65-4321',
            role: PersonRole.SPOUSE,
            isBlind: false,
            dateOfBirth: '1965-01-01',
            isTaxpayerDependent: false
        }
    },
    w2s: [
        {
            income: 48736,
            fedWithholding: 5000,
            ssWages: 48736,
            ssWithholding: 3000,
            medicareIncome: 48736,
            medicareWithholding: 700,
            state: 'NJ',
            stateWages: 48736,
            stateWithholding: 1503,
            occupation: 'Quarry Worker',
            personRole: PersonRole.PRIMARY
        }
    ],
    f1099s: [
        {
            type: Income1099Type.INT,
            payer: 'Bank',
            form: {
                income: 67
            },
            personRole: PersonRole.PRIMARY
        },
        {
            type: Income1099Type.DIV,
            payer: 'Market',
            form: {
                dividends: 254,
                qualifiedDividends: 0,
                totalCapitalGainsDistributions: 0
            },
            personRole: PersonRole.PRIMARY
        },
        {
            type: Income1099Type.R,
            payer: 'Pension Fund',
            form: {
                grossDistribution: 20000,
                taxableAmount: 18000,
                federalIncomeTaxWithheld: 2000,
                planType: PlanType1099.Pension
            },
            personRole: PersonRole.PRIMARY
        }
    ],
    scheduleD: {
        transactions: [
            {
                description: 'Stock Sale',
                proceeds: 10000,
                costBasis: 1118,
                reportingCategory: 'A'
            }
        ]
    },
    newJersey: {
        veteran: true,
        spouseVeteran: false,
        pensionExclusion: 10000,
        medicalExpenses: 5000,
        propertyTaxPaid: 8000,
        homeowner: true,
        tenant: false
    },
    questions: {},
    stateResidencies: [{ state: 'NJ' }],
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

describe('NJ 2024 Tax Engine', () => {
    it('calculates tax correctly for OTS example', () => {
        const result = NJ2024Engine.calculate(mockInfo as any)
        const l = result.lines

        console.log('NJ Lines:', JSON.stringify(l, null, 2))

        // Exemptions
        // L6 (Regular): 2000 (MFJ)
        // L7 (Age 65): 0 (Dates in mock might need adjustment to trigger senior if logic existed)
        // L9 (Vet): 6000 (1 Vet)
        // L13 (Total): 8000
        expect(l['6']).toBe(2000)
        expect(l['9']).toBe(6000)
        expect(l['13']).toBe(8000)

        // Income
        // L15 Wages: 48736
        // L16 Int: 67
        // L17 Div: 254
        // L19 CapGain: 10000 - 1118 = 8882
        // L20 Pension: 18000
        // L27 Total: 48736 + 67 + 254 + 8882 + 18000 = 75939
        // OTS might vary if Pension handling differs.
        expect(l['15']).toBe(48736)
        expect(l['19']).toBe(8882)
        expect(l['20']).toBe(18000)
        expect(l['27']).toBe(75939)

        // L28 Exclusion: 10000
        expect(l['28']).toBe(10000)

        // L29 Gross Income: 65939
        expect(l['29']).toBe(65939)

        // L31 Medical
        // Store: 5000. Limit: 0.02 * 65939 = 1318.78.
        // Ded: 5000 - 1318 = 3681 (approx)
        expect(l['31']).toBeCloseTo(3681, 0)

        // L38 Total Ded: 3681 + 8000 (Exemptions) = 11681
        expect(l['38']).toBeCloseTo(11681, 0)

        // L39 Taxable: 65939 - 11681 = 54258
        expect(l['39']).toBeCloseTo(54258, 0)

        // L43 Tax
        // MFJ Table for 54258
        // < 50k: 50000 * 0.0175 - 70 = 805
        // > 50k: (54258) bracket...
        // Formula: 54258 is < 70k. rate 0.0245 - 420.
        // Tax = 54258 * 0.0245 - 420 = 1329.32 - 420 = 909.
        expect(l['43']).toBeCloseTo(909, -1) // Allow rounding diff

        // L57 Prop Tax Credit: 50
        expect(l['57']).toBe(50)
    })
})
