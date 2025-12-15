
import { Fed2024Engine } from '../Y2024'
import {
    FilingStatus,
    Information,
    PersonRole,
    TaxPayer
} from 'freeustaxes/core/data'

describe('Federal 2024 Engine', () => {
    it('matches OTS US_1040_example output', () => {
        const info: Information = {
            taxPayer: {
                filingStatus: FilingStatus.MFJ,
                primaryPerson: {
                    firstName: 'Fred',
                    lastName: 'Smythe',
                    ssid: '409-31-7804',
                    role: PersonRole.PRIMARY,
                    isBlind: false,
                    dateOfBirth: new Date('1970-01-01'), // < 65
                    address: { address: '123 Main', city: 'Anytown', state: 'IL', zip: '12345' },
                    isTaxpayerDependent: false
                },
                spouse: {
                    firstName: 'Sarah',
                    lastName: 'Smythe',
                    ssid: '409-33-9408',
                    role: PersonRole.SPOUSE,
                    isBlind: false,
                    dateOfBirth: new Date('1950-01-01'), // > 65
                    isTaxpayerDependent: false
                },
                dependents: []
            },
            w2s: [
                {
                    income: 20267.70,
                    personRole: PersonRole.PRIMARY
                } as any,
                {
                    income: 28188.53,
                    personRole: PersonRole.SPOUSE
                } as any,
                { income: 10 } as any, // L1b
                { income: 20 } as any, // L1c
                { income: 30 } as any, // L1d
                { income: 40 } as any, // L1e
                { income: 50 } as any, // L1f
                { income: 60 } as any, // L1g
                { income: 70 } as any, // L1h
                // L1i (80) excluded
            ],
            f1099s: [
                { type: 'INT', form: { income: 37.71 } } as any,
                { type: 'INT', form: { income: 12.65 } } as any,
                { type: 'INT', form: { income: 16.85 } } as any,
                { type: 'DIV', form: { dividends: 70.90, qualifiedDividends: 70.90 } } as any,
                { type: 'DIV', form: { dividends: 44.36, qualifiedDividends: 14.36 } } as any,
                { type: 'DIV', form: { dividends: 64.13, qualifiedDividends: 0.00 } } as any,
                { type: 'DIV', form: { dividends: 74.52, qualifiedDividends: 61.25 } } as any,
                { type: 'R', form: { grossDistribution: 41.41, taxableAmount: 41.00, planType: 'IRA' } } as any,
                { type: 'R', form: { grossDistribution: 43.43, taxableAmount: 43.00, planType: 'Pension' } } as any,
                { type: 'SSA', form: { netBenefits: 6.00 } } as any
            ],
            schedule1: {
                additionalIncome: {
                    taxableRefunds: 20.11, // S1_1
                    alimonyReceived: 22, // S1_2a
                    businessIncome: 3, // S1_3
                    otherGains: 17.18, // S1_4
                    rentalRealEstate: 5, // S1_5
                    farmIncome: 6, // S1_6
                    unemployment: 7, // S1_7
                    netOperatingLoss: 8.01, // S1_8a (Engine handles abs/neg)
                    gamblingIncome: 7.02, // S1_8b
                    cancellationOfDebt: 6.03, // S1_8c
                    foreignEarnedIncomeExclusion: 8.04, // S1_8d (Engine handles subtractions)
                    nontaxableMedicaidWaiver: 9.19, // S1_8s (Engine handles subtractions)
                    otherIncome: {
                        e: 9.01, f: 9.02, g: 9.03, h: 9.04, i: 9.05,
                        j: 9.10, k: 9.11, l: 9.12, m: 9.13, n: 9.14,
                        o: 9.15, p: 9.16, q: 9.17, r: 9.18,
                        t: 9.20, u: 9.21, v: 10.22, z: 8.17
                    }
                },
                adjustments: {
                    educatorExpenses: 6.10, // S1_11
                    reservistBusinessExpenses: 2, // S1_12
                    healthSavingsAccountDeduction: 3, // S1_13
                    movingExpenses: 4, // S1_14
                    selfEmploymentTaxDeduction: 5, // S1_15
                    selfEmployedSEP: 6, // S1_16
                    selfEmployedHealthInsurance: 7, // S1_17
                    penaltyOnEarlyWithdrawal: 8, // S1_18
                    alimonyPaid: 19, // S1_19a
                    iraDeduction: 10, // S1_20
                    studentLoanInterestDeduction: 44.08, // S1_21
                    archerMSADeduction: 23, // S1_23
                    otherAdjustments: {
                        a: 24, b: 23, c: 22, d: 10.01, e: 4, f: 5,
                        g: 10.02, h: 6, i: 7, j: 8, k: 9, z: 10.03
                    }
                }
            },
            scheduleD: {
                transactions: [
                    // Short Term
                    { description: 'WMT', proceeds: 950.99, costBasis: 800.99, reportingCategory: 'A' },
                    { description: 'AAP', proceeds: 1950.99, costBasis: 1800.99, reportingCategory: 'A' },
                    // Long Term
                    { description: 'XOM', proceeds: 4209.95, costBasis: 3658.22, adjustmentCode: 'B', adjustmentAmount: 12.34, reportingCategory: 'D' },
                    { description: 'NAB', proceeds: 6009.01, costBasis: 4949.98, reportingCategory: 'D' },
                    { description: 'FBK', proceeds: 6009.01, costBasis: 4949.98, reportingCategory: 'D' },
                    { description: 'IBM', proceeds: 1000, costBasis: 100, reportingCategory: 'E' },
                    { description: 'SNA', proceeds: 1000, costBasis: 8000, reportingCategory: 'E' },
                    { description: 'MSFT', proceeds: 9000, costBasis: 900, reportingCategory: 'F' },
                    { description: 'CLF', proceeds: 4000, costBasis: 100, reportingCategory: 'F' }
                ]
            },
            realEstate: [],
            estimatedTaxes: [],
            f1098es: [],
            f3921s: [],
            scheduleK1Form1065s: [],
            itemizedDeductions: undefined,
            questions: {},
            credits: [],
            stateResidencies: [],
            healthSavingsAccounts: [],
            individualRetirementArrangements: [],
            qbiDeduction: 13
        }

        const result = Fed2024Engine.calculate(info)

        // Expected L1z: 48736.23
        expect(result.lines['1z']).toBeCloseTo(48736.23, 2)

        // Expected L2b (Interest): 67.21
        expect(result.lines['2b']).toBeCloseTo(67.21, 2)

        // Expected L3b (Dividends): 253.91
        expect(result.lines['3b']).toBeCloseTo(253.91, 2)

        // Expected L8 (Sched 1 Add Income): 232.31
        expect(result.lines['8']).toBeCloseTo(232.31, 2)

        // Expected L10 (Sched 1 Adjustments): 275.24
        expect(result.lines['10']).toBeCloseTo(275.24, 2)

        // Expected Schedule D Lines
        // D7 (Net Short Term): 300.00
        expect(result.lines['D7']).toBeCloseTo(300.00, 2)
        // D15 (Net Long Term): 8582.13
        expect(result.lines['D15']).toBeCloseTo(8582.13, 2)
        // D16 (Total): 8882.13
        expect(result.lines['D16']).toBeCloseTo(8882.13, 2)
        // L7 (Cap Gains on 1040): 8882.13
        expect(result.lines['7']).toBeCloseTo(8882.13, 2)

        // Expected L4a, L4b (IRA)
        expect(result.lines['4a']).toBeCloseTo(41.41, 2)
        expect(result.lines['4b']).toBeCloseTo(41.00, 2)

        // Expected L5a, L5b (Pensions)
        expect(result.lines['5a']).toBeCloseTo(43.43, 2)
        expect(result.lines['5b']).toBeCloseTo(43.00, 2)

        // Expected L6a, L6b (SS) - Partial verification
        expect(result.lines['6a']).toBeCloseTo(6.00, 2)
        expect(result.lines['6b']).toBeCloseTo(5.10, 2)

        // Expected L12: 30750
        expect(result.lines['12']).toBe(30750)

        // Expected L16 (Tax): 1848.00
        expect(result.lines['16']).toBe(1848.00)
    })
})
