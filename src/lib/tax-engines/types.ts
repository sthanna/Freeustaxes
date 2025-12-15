
export type TaxFormLines = { [key: string]: number | undefined }

export interface TaxEngine<InputType, ResultType> {
    calculate: (input: InputType) => ResultType
}

/**
 * Base result to standardize output across different forms if needed,
 * or just a marker interface.
 */
export interface TaxResult {
    lines: TaxFormLines
}
