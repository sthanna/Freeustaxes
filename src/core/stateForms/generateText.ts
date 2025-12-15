import Form from './Form'
import { Field } from '../pdfFiller'

const isMethod = (obj: any, key: string): boolean =>
    typeof obj[key] === 'function'

const formatValue = (val: Field): string => {
    if (val === undefined) return 'undefined'
    if (typeof val === 'boolean') return val ? '[X]' : '[ ]'
    if (typeof val === 'object' && 'select' in val) return `Select Index: ${val.select}`
    return val.toString()
}

export const generateStateText = (forms: Form[]): string => {
    let output = ''

    forms.forEach((form) => {
        output += `FORM: ${form.formName} (${form.state})\n`
        output += '====================================\n'

        // Get all properties from the instance and prototype
        const keys = new Set<string>()
        let obj = form
        while (obj && obj !== Object.prototype) {
            Object.getOwnPropertyNames(obj).forEach((k) => keys.add(k))
            Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).forEach((k) => keys.add(k))
            obj = Object.getPrototypeOf(obj)
        }

        const sortedKeys = Array.from(keys).sort((a, b) => {
            // Sort to keep lines in order if possible
            const aNum = parseInt(a.replace(/\D/g, '')) || 0
            const bNum = parseInt(b.replace(/\D/g, '')) || 0
            if (aNum !== bNum) return aNum - bNum
            return a.localeCompare(b)
        })

        sortedKeys.forEach((key) => {
            // Filter out base class methods and internal properties
            if (
                ['fields', 'attachments', 'constructor', 'pdf', 'errors', 'validation', 'renderedFields'].includes(key) ||
                key.startsWith('_')
            ) {
                return
            }

            // We only care about line items, checkboxes, and specific fields
            // Common patterns: l1, l10, CheckBox1, name, ssn, city, etc.
            // We can be permissive: if it returns a string/number/bool/Field, print it.
            // But we must call it if it's a function.

            try {
                // @ts-ignore
                const value = typeof form[key] === 'function' ? form[key]() : form[key]

                // Basic type check to ensure we are printing relevant data
                if (['string', 'number', 'boolean', 'undefined', 'object'].includes(typeof value)) {
                    // Ignore heavy objects like 'info', 'f1040', 'methods' which are properties
                    if (key === 'info' || key === 'f1040' || key === 'methods' || key === 'state' || key === 'formName' || key === 'formOrder') return
                    if (key === 'scheduleEIC' || key === 'il1040V') return

                    const strVal = formatValue(value)
                    output += `${key}: ${strVal}\n`
                }
            } catch (e) {
                // Ignore methods that require arguments or fail
            }
        })
        output += '\n\n'
    })

    return output
}
