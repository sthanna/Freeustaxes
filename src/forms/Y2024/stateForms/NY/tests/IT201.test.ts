import { FilingStatus, PersonRole } from 'freeustaxes/core/data'
import F1040 from '../../../irsForms/F1040'
import IT201 from '../IT201'
import { NY_STANDARD_DEDUCTION, NY_DEPENDENT_EXEMPTION } from '../data'

describe('IT201', () => {
  const createForm = (
    filingStatus: FilingStatus = FilingStatus.S,
    wages: number = 0,
    dependents: number = 0
  ): IT201 => {
    const f1040 = {
      info: {
        taxPayer: {
          filingStatus,
          dependents: new Array(dependents).fill({ role: PersonRole.DEPENDENT })
        }
      },
      l11: () => wages, // Federal AGI
      l6b: () => 0 // Social Security
    } as unknown as F1040

    return new IT201(f1040)
  }

  it('should calculate standard deduction correctly for Single', () => {
    const form = createForm(FilingStatus.S, 50000)
    expect(form.l34()).toBe(NY_STANDARD_DEDUCTION[FilingStatus.S])
  })

  it('should calculate standard deduction correctly for MFJ', () => {
    const form = createForm(FilingStatus.MFJ, 50000)
    expect(form.l34()).toBe(NY_STANDARD_DEDUCTION[FilingStatus.MFJ])
  })

  it('should calculate dependent exemptions correctly', () => {
    const form = createForm(FilingStatus.MFJ, 50000, 2)
    // 2 * 1000 = 2000
    expect(form.l36()).toBe(2000)
  })

  it('should calculate taxable income correctly', () => {
    const form = createForm(FilingStatus.MFJ, 50000, 2)
    // AGI: 50000
    // Std Ded: 16050
    // Dep Exemption: 2000
    // Taxable: 50000 - 16050 - 2000 = 31950
    expect(form.l37()).toBe(31950)
  })

  it('should calculate tax correctly for low income (Single)', () => {
    // Income: 8000 (Std Ded) + 5000 (Taxable) = 13000
    const form = createForm(FilingStatus.S, 13000)
    // Taxable: 5000
    // Bracket 1: 0 - 8500 @ 4%
    // Tax: 5000 * 0.04 = 200
    expect(form.l39()).toBeCloseTo(200)
  })

  it('should calculate tax correctly for higher income (Single)', () => {
    // Income: 8000 (Std Ded) + 10000 (Taxable) = 18000
    const form = createForm(FilingStatus.S, 18000)
    // Taxable: 10000
    // Bracket 1: 8500 * 0.04 = 340
    // Bracket 2: (10000 - 8500) * 0.045 = 1500 * 0.045 = 67.5
    // Total: 407.5
    expect(form.l39()).toBeCloseTo(407.5)
  })
})
