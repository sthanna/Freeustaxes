import { FilingStatus } from 'freeustaxes/core/data'

export const NJ_EXEMPTION = 1000
export const NJ_DEPENDENT_EXEMPTION = 1500

// 2023 Tax Brackets (used as 2024 placeholder)
// Source: https://www.state.nj.us/treasury/taxation/pdf/current/1040i.pdf
export const NJ_TAX_BRACKETS = {
  [FilingStatus.S]: [
    { limit: 20000, rate: 0.014 },
    { limit: 35000, rate: 0.0175 },
    { limit: 40000, rate: 0.035 },
    { limit: 75000, rate: 0.05525 },
    { limit: 500000, rate: 0.0637 },
    { limit: 1000000, rate: 0.0897 },
    { limit: Infinity, rate: 0.1075 }
  ],
  [FilingStatus.MFJ]: [
    { limit: 20000, rate: 0.014 },
    { limit: 50000, rate: 0.0175 },
    { limit: 70000, rate: 0.0245 },
    { limit: 80000, rate: 0.035 },
    { limit: 150000, rate: 0.05525 },
    { limit: 500000, rate: 0.0637 },
    { limit: 1000000, rate: 0.0897 },
    { limit: Infinity, rate: 0.1075 }
  ],
  [FilingStatus.MFS]: [
    { limit: 20000, rate: 0.014 },
    { limit: 35000, rate: 0.0175 },
    { limit: 40000, rate: 0.035 },
    { limit: 75000, rate: 0.05525 },
    { limit: 500000, rate: 0.0637 },
    { limit: 1000000, rate: 0.0897 },
    { limit: Infinity, rate: 0.1075 }
  ],
  [FilingStatus.HOH]: [
    { limit: 20000, rate: 0.014 },
    { limit: 50000, rate: 0.0175 },
    { limit: 70000, rate: 0.0245 },
    { limit: 80000, rate: 0.035 },
    { limit: 150000, rate: 0.05525 },
    { limit: 500000, rate: 0.0637 },
    { limit: 1000000, rate: 0.0897 },
    { limit: Infinity, rate: 0.1075 }
  ],
  [FilingStatus.W]: [
    { limit: 20000, rate: 0.014 },
    { limit: 50000, rate: 0.0175 },
    { limit: 70000, rate: 0.0245 },
    { limit: 80000, rate: 0.035 },
    { limit: 150000, rate: 0.05525 },
    { limit: 500000, rate: 0.0637 },
    { limit: 1000000, rate: 0.0897 },
    { limit: Infinity, rate: 0.1075 }
  ]
}
