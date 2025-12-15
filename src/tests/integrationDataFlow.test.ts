
import NJ1040 from '../forms/Y2024/stateForms/NJ/NJ1040'
import F1040 from '../forms/Y2024/irsForms/F1040'
import { FilingStatus, Person, PersonRole } from '../core/data'

describe('Federal to State Data Flow Integration', () => {

    const createMockF1040 = (wages: number, interest: number) => {
        const info: any = {
            taxPayer: {
                filingStatus: FilingStatus.S,
                primaryPerson: {
                    firstName: 'Token', lastName: 'User', ssid: '000-00-0000',
                    address: { address: '123 St', city: 'City', state: 'NJ', zip: '07000' }
                },
                dependents: [],
                contactPhoneNumber: '',
                contactEmail: ''
            },
            w2s: [],
            f1099s: [],
            f1098es: [],
            scheduleK1Form1065s: [],
            individualRetirementArrangements: [],
            estimatedTaxes: [],
            credits: [],
            questions: {},
            stateResidencies: [],
            healthSavingsAccounts: [],
            f3921s: [],
            refund: { routingNumber: '', accountNumber: '', accountType: 'checking' }
        }

        const f1040 = new F1040(info, [])

        // Mock computed Federal lines that flow to state
        f1040.l1z = () => wages
        f1040.l2b = () => interest
        f1040.l3b = () => 0 // Dividends

        return f1040
    }

    test('NJ-1040 should inherit Wages (Line 14) from Federal Return', () => {
        const fed = createMockF1040(75000, 0)
        const state = new NJ1040(fed)

        // NJ Line 14 = Fed Wages
        expect(state.l14()).toBe(75000)
    })

    test('NJ-1040 should inherit Interest (Line 15) from Federal Return', () => {
        const fed = createMockF1040(50000, 1200)
        const state = new NJ1040(fed)

        // NJ Line 15 = Fed Taxable Interest
        expect(state.l15()).toBe(1200)
    })

    test('NJ-1040 should calculate Line 29 (Gross Income) correctly from inherited data', () => {
        // Wages 100k, Interest 5k -> Gross 105k
        const fed = createMockF1040(100000, 5000)
        const state = new NJ1040(fed)

        expect(state.l29()).toBe(105000)
    })

    test('NJ-1040 should calculate Tax (Line 42) based on inherited Gross Income', () => {
        // 60k Income -> Taxable roughly 59k (minus 1k exemption) -> Tax check
        const fed = createMockF1040(60000, 0)
        const state = new NJ1040(fed)

        expect(state.l42()).toBeGreaterThan(0)
        // We already verified exact math in Golden Master, here we just check it is calculating *something* based on flow
    })
})
