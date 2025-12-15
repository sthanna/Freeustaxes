
import { NY2024Engine } from '../Y2024'
import { FilingStatus, Information, PersonRole, TaxYear, Income1099Type, PlanType1099 } from 'freeustaxes/core/data'

describe('NY 2024 Tax Engine', () => {
    test('Golden File: NY_IT201_example matches OTS output', () => {
        const info: any = {
            taxPayer: {
                filingStatus: FilingStatus.MFJ,
                primaryPerson: {
                    firstName: 'Fred',
                    lastName: 'Smythe',
                    ssid: '409317804',
                    address: {
                        address: '1567 W. Hamptonshire',
                        city: 'Town',
                        state: 'NY',
                        zip: '10001'
                    },
                    role: PersonRole.PRIMARY,
                    isBlind: false,
                    dateOfBirth: '1988-11-11',
                    isTaxpayerDependent: false
                },
                spouse: {
                    firstName: 'Sarah',
                    lastName: 'Smythe',
                    ssid: '409339408',
                    role: PersonRole.SPOUSE,
                    isBlind: false,
                    dateOfBirth: '1991-01-02',
                    isTaxpayerDependent: false
                },
                dependents: [
                    {
                        firstName: 'Emma',
                        lastName: 'Anderson',
                        ssid: '987654321',
                        relationship: 'Stepdaughter',
                        role: PersonRole.DEPENDENT,
                        isBlind: false,
                        dateOfBirth: '2010-01-01' // Dummy
                    }
                ]
            },
            w2s: [
                {
                    employer: { employerName: 'Employer A' },
                    income: 48736,
                    medicareIncome: 0,
                    fedWithholding: 0,
                    ssWages: 0,
                    ssWithholding: 0,
                    medicareWithholding: 0,
                    personRole: PersonRole.PRIMARY,
                    state: 'NY',
                    stateWages: 48736,
                    stateWithholding: 1503, // L72
                    occupation: 'Worker'
                }
            ],
            f1099s: [
                {
                    type: Income1099Type.INT,
                    payer: 'Bank',
                    form: { income: 67 },
                    personRole: PersonRole.PRIMARY
                },
                {
                    type: Income1099Type.DIV,
                    payer: 'Stocks',
                    form: { dividends: 254, qualifiedDividends: 0, totalCapitalGainsDistributions: 0 },
                    personRole: PersonRole.PRIMARY
                },
                {
                    type: Income1099Type.R,
                    payer: 'Pension',
                    form: { grossDistribution: 41, taxableAmount: 41, federalIncomeTaxWithheld: 0, planType: PlanType1099.Pension },
                    personRole: PersonRole.PRIMARY
                }
            ],
            schedule1: {
                additionalIncome: {
                    taxableRefunds: 20, // L4 / NY L25
                    alimonyReceived: 22, // L5
                    businessIncome: 3, // L6
                    otherGains: 17, // L8
                    rentalRealEstate: 43, // L10 (OTS L10 was 43)
                    farmIncome: 5, // L11
                    unemployment: 6, // L13
                    otherIncome: { 'L14': 5, 'L15': 7, 'L16': 152 } // L14=SS(5), L15=Other(7), L16=Other(152)
                },
                adjustments: {
                    otherAdjustments: { 'L18': 275 } // L18 Total Adjustments
                }
            },
            scheduleD: {
                transactions: [
                    {
                        description: 'Sale',
                        proceeds: 18882, // Diff 8882
                        costBasis: 10000,
                        reportingCategory: 'A'
                    }
                ]
            },
            newYork: {
                interestNonNY: 20, // L20
                publicEmployeeRetirementContribs: 21, // L21
                ny529Distributions: 22, // L22
                otherAdditions: 23, // L23
                pensionsNY: 26, // L26
                usGovInterest: 28, // L28
                pensionExclusion: 29, // L29
                ny529Deduction: 30, // L30
                otherSubtractions: 31, // L31 (L27 handled auto as 5)
                residentCredit: 41, // L41
                otherNonRefundableCredits: 42, // L42
                netOtherNYTaxes: 45, // L45
                salesUseTax: 59, // L59
                voluntaryGifts: 60, // L60
                empireStateChildCredit: 63,
                childCareCredit: 64,
                earnedIncomeCredit: 65,
                nonCustodialParentEIC: 66,
                realPropertyCredit: 67,
                collegeTuitionCredit: 68,
                otherRefundableCredits: 71,
            },
            estimatedTaxes: [
                { label: 'NY Est', payment: 75 }
            ],
            questions: {},
            realEstate: [],
            f1098es: [],
            f3921s: [],
            scheduleK1Form1065s: [],
            itemizedDeductions: undefined,
            credits: [],
            stateResidencies: [],
            healthSavingsAccounts: [],
            individualRetirementArrangements: []
        }

        const result = NY2024Engine.calculate(info as any)
        const l = result.lines
        // console.log(JSON.stringify(l, null, 2))
        require('fs').writeFileSync('ny_test_result.json', JSON.stringify(l, null, 2))

        try {
            expect(l['1']).toBe(48736)
            expect(l['19']).toBe(57985) // Verified
            expect(l['24']).toBe(58071) // Verified
            expect(l['32']).toBe(169)   // Verified
            expect(l['33']).toBe(57902) // NY AGI Match
            expect(l['34']).toBe(16050) // Standard Ded
            expect(l['36']).toBe(1000) // Exemption
            expect(l['39']).toBe(1916) // Tax (Table lookup rounding match)
            expect(l['43']).toBe(83)   // Total Credits
            expect(l['44']).toBe(1833) // Tax - Credits
            expect(l['46']).toBe(1878) // Total NY Tax
        } catch (e: any) {
            console.error('Assertion Failed:', e.message)
            throw e
        }
    })
})
