
import { MA2024Engine } from '../Y2024'
import { Information, FilingStatus, PersonRole, TaxYear, PlanType1099, Income1099Type } from 'freeustaxes/core/data'
import { TaxResult } from '../../types'

describe('MA 2024 Tax Engine', () => {
    test('Golden File: US_1040_example matches OTS output', () => {
        // OTS Example Data Mapping

        const info: any = {
            taxPayer: {
                filingStatus: FilingStatus.MFJ,
                primaryPerson: {
                    firstName: "Tessa",
                    lastName: "Cradious",
                    ssid: "123456789",
                    role: PersonRole.PRIMARY,
                    isBlind: true, // BlindYou=True
                    dateOfBirth: "1980-01-01", // Not 65
                    address: {
                        address: "123 South Crumberry St",
                        city: "Worcestor",
                        state: "MA",
                        zip: "01605"
                    },
                    isTaxpayerDependent: false
                },
                spouse: {
                    firstName: "Raymond",
                    lastName: "Cradious",
                    ssid: "987654321",
                    role: PersonRole.SPOUSE,
                    isBlind: false,
                    dateOfBirth: "1950-01-01", // Age 65+ (Born before 1960)
                    isTaxpayerDependent: false
                },
                dependents: [
                    { firstName: "Dep1", lastName: "C", ssid: "1", role: PersonRole.DEPENDENT, isBlind: false, dateOfBirth: "2010-01-01", relationship: "Child" },
                    { firstName: "Dep2", lastName: "C", ssid: "2", role: PersonRole.DEPENDENT, isBlind: false, dateOfBirth: "2012-01-01", relationship: "Child" }
                ],
            },
            w2s: [
                {
                    employer: { employerName: "Job 1" },
                    occupation: "Job",
                    income: 60000,
                    fedWithholding: 0,
                    ssWages: 0,
                    ssWithholding: 1800, // Part of L11 logic
                    medicareIncome: 0,
                    medicareWithholding: 200, // 1800+200 = 2000 (Matches L11a input)
                    state: "MA",
                    stateWages: 60000,
                    stateWithholding: 3530, // L38a
                    personRole: PersonRole.PRIMARY
                },
                {
                    employer: { employerName: "Spouse Job" },
                    occupation: "Job",
                    income: 0,
                    fedWithholding: 0,
                    ssWages: 0,
                    ssWithholding: 1000,
                    medicareIncome: 0,
                    medicareWithholding: 200, // 1000+200 = 1200 (Matches L11b input)
                    state: "MA",
                    stateWages: 0,
                    stateWithholding: 38, // Hacking L38c "Other" into spouse W2 state tax
                    personRole: PersonRole.SPOUSE
                }
            ],
            f1099s: [
                {
                    type: Income1099Type.INT,
                    payer: "Bank",
                    form: {
                        income: 180,
                        stateTaxWithheld: 34 // L38b
                    },
                    personRole: PersonRole.PRIMARY
                }
            ],
            schedule1: {
                additionalIncome: {
                    businessIncome: 660, // L6a
                    farmIncome: 66, // L6b
                    rentalRealEstate: 45000, // L7
                }
            },
            scheduleD: {
                transactions: []
            },
            massachusetts: {
                rentPaid: 14, // L14a
                medicalDental: 0,
                limitedIncomeCredit: 29, // L29
            },
            // Empty Arrays for required fields
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
            individualRetirementArrangements: []
        }

        const result = MA2024Engine.calculate(info as any)
        const l = result.lines

        // Exemptions (L2)
        // 2a: MFJ = 8800
        expect(l['2a']).toBe(8800)
        // 2b: 2 Deps * 1000 = 2000
        expect(l['2b']).toBe(2000)
        // 2c: Age 65 (Spouse only) = 1 * 700 = 700
        expect(l['2c']).toBe(700)
        // 2d: Blind (You only) = 1 * 2200 = 2200
        expect(l['2d']).toBe(2200)

        // 2g Total: 8800 + 2000 + 700 + 2200 = 13700
        expect(l['2g']).toBe(13700)

        // Income
        expect(l['3']).toBe(60000)
        expect(l['5']).toBe(180)
        expect(l['6']).toBe(726) // 660 + 66
        expect(l['7']).toBe(45000)
        expect(l['10']).toBe(105906) // 60000 + 180 + 726 + 45000 = 105906

        // Deductions
        // L11: 2000 + 1200 = 3200
        expect(l['11']).toBe(3200)
        // L14: 14 * 0.5 = 7
        expect(l['14']).toBe(7)

        // L16 Total: 3200 + 7 = 3207
        expect(l['16']).toBe(3207)

        // L17 Net 5% Income: 105906 - 3207 = 102699
        expect(l['17']).toBe(102699)

        // L19 After Exemptions: 102699 - 13700 = 88999
        expect(l['19']).toBe(88999)

        // L21 Taxable: 88999
        expect(l['21']).toBe(88999)

        // L22 Tax: 88999 * 0.05 = 4449.95.
        expect(l['22']).toBeCloseTo(4449.95, 2)

        // L38 Withholding: 3530 + 38 + 34 = 3602
        expect(l['38']).toBe(3602)
    })
})
