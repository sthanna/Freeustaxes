import { FilingStatus } from 'freeustaxes/core/data'

export const NY_STANDARD_DEDUCTION = {
  [FilingStatus.S]: 8000,
  [FilingStatus.MFJ]: 16050,
  [FilingStatus.MFS]: 8000,
  [FilingStatus.HOH]: 11200,
  [FilingStatus.W]: 16050
}

export const NY_DEPENDENT_EXEMPTION = 1000

// 2023 Tax Brackets (used as 2024 placeholder)
// Source: https://www.tax.ny.gov/pdf/current_forms/it/it201i.pdf (2023 instructions)
export const NY_TAX_BRACKETS = {
  [FilingStatus.S]: [
    { limit: 8500, rate: 0.04 },
    { limit: 11700, rate: 0.045 },
    { limit: 13900, rate: 0.0525 },
    { limit: 80650, rate: 0.0585 },
    { limit: 215400, rate: 0.0625 },
    { limit: 1077550, rate: 0.0685 },
    { limit: 5000000, rate: 0.0965 },
    { limit: 25000000, rate: 0.103 },
    { limit: Infinity, rate: 0.109 }
  ],
  [FilingStatus.MFJ]: [
    { limit: 17150, rate: 0.04 },
    { limit: 23600, rate: 0.045 },
    { limit: 27900, rate: 0.0525 },
    { limit: 161550, rate: 0.0585 },
    { limit: 323200, rate: 0.0625 },
    { limit: 2155350, rate: 0.0685 },
    { limit: 5000000, rate: 0.0965 },
    { limit: 25000000, rate: 0.103 },
    { limit: Infinity, rate: 0.109 }
  ],
  [FilingStatus.MFS]: [
    { limit: 8500, rate: 0.04 },
    { limit: 11700, rate: 0.045 },
    { limit: 13900, rate: 0.0525 },
    { limit: 80650, rate: 0.0585 },
    { limit: 215400, rate: 0.0625 },
    { limit: 1077550, rate: 0.0685 },
    { limit: 5000000, rate: 0.0965 },
    { limit: 25000000, rate: 0.103 },
    { limit: Infinity, rate: 0.109 }
  ],
  [FilingStatus.HOH]: [
    { limit: 12800, rate: 0.04 },
    { limit: 17650, rate: 0.045 },
    { limit: 20900, rate: 0.0525 },
    { limit: 107650, rate: 0.0585 },
    { limit: 269300, rate: 0.0625 },
    { limit: 1616450, rate: 0.0685 },
    { limit: 5000000, rate: 0.0965 },
    { limit: 25000000, rate: 0.103 },
    { limit: Infinity, rate: 0.109 }
  ],
  [FilingStatus.W]: [
    { limit: 17150, rate: 0.04 },
    { limit: 23600, rate: 0.045 },
    { limit: 27900, rate: 0.0525 },
    { limit: 161550, rate: 0.0585 },
    { limit: 323200, rate: 0.0625 },
    { limit: 2155350, rate: 0.0685 },
    { limit: 5000000, rate: 0.0965 },
    { limit: 25000000, rate: 0.103 },
    { limit: Infinity, rate: 0.109 }
  ]
}
