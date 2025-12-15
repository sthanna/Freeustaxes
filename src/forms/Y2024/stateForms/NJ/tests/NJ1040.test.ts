import { FilingStatus, PersonRole } from 'freeustaxes/core/data'
import F1040 from '../../../irsForms/F1040'
import NJ1040 from '../NJ1040'
import { NJ_EXEMPTION, NJ_DEPENDENT_EXEMPTION } from '../data'

describe('NJ1040', () => {
    const createForm = (
        filingStatus: FilingStatus = FilingStatus.S,
        wages: number = 0,
        dependents: number = 0
    ): NJ1040 => {
        const f1040 = {
            info: {
                taxPayer: {
                    filingStatus,
                    dependents: new Array(dependents).fill({ role: PersonRole.DEPENDENT })
                }
            },
            l1z: () => wages, // Wages
            l2b: () => 0, // Taxable Interest
            l3b: () => 0 // Dividends
        } as unknown as F1040

        return new NJ1040(f1040)
    }

    it('should calculate exemptions correctly for Single', () => {
        const form = createForm(FilingStatus.S, 50000)
        expect(form.l30()).toBe(NJ_EXEMPTION)
    })

    it('should calculate exemptions correctly for MFJ with dependents', () => {
        const form = createForm(FilingStatus.MFJ, 50000, 2)
        // 1000 (Self) + 1000 (Spouse) + 2 * 1500 (Dependents) = 5000
        expect(form.l30()).toBe(1000 + 1000 + 3000)
    })

    it('should calculate tax correctly for low income (Single)', () => {
        // Income: 20000
        // Exemptions: 1000
        // Taxable: 19000
        const form = createForm(FilingStatus.S, 20000)
        // Taxable: 19000
        // Bracket 1: 0 - 20000 @ 1.4%
        // Tax: 19000 * 0.014 = 266
        expect(form.l42()).toBeCloseTo(266)
    })

    it('should calculate tax correctly for higher income (Single)', () => {
        // Income: 40000
        // Exemptions: 1000
        // Taxable: 39000
        const form = createForm(FilingStatus.S, 40000)

        // Taxable: 39000
        // Bracket 1: 20000 * 0.014 = 280
        // Bracket 2: 15000 * 0.0175 = 262.5
        // Bracket 3: (39000 - 35000) * 0.035 = 4000 * 0.035 = 140
        // Total: 280 + 262.5 + 140 = 682.5
        expect(form.l42()).toBeCloseTo(682.5)
    })
})
