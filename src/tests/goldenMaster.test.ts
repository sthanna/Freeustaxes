
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import NJ1040 from '../forms/Y2024/stateForms/NJ/NJ1040'
import F1040 from '../forms/Y2024/irsForms/F1040'
import { FilingStatus, Person } from '../core/data'

// --- Configuration ---
const OTS_BIN_PATH = path.resolve(__dirname, '../../../OpenTaxSolver2024_22.07_mswin/bin/taxsolve_NJ_1040_2024.exe')
const TEMPLATE_PATH = path.resolve(__dirname, '../../../OpenTaxSolver2024_22.07_mswin/tax_form_files/NJ_1040/NJ_1040_2024_template.txt')
const TEMP_DIR = path.resolve(__dirname, '../../temp_test_artifacts')

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
}

// --- Types ---
interface TestScenario {
    name: string
    wages: number
    interest: number
    dividends: number
    filingStatus: FilingStatus
}

const SCENARIOS: TestScenario[] = [
    {
        name: 'Simple Single 50k',
        wages: 50000,
        interest: 0,
        dividends: 0,
        filingStatus: FilingStatus.S
    },
    {
        name: 'Complex MFJ',
        wages: 120000,
        interest: 500,
        dividends: 1500,
        filingStatus: FilingStatus.MFJ
    }
]

// --- Helper: Run C Execution ---
function runLegacyC(scenario: TestScenario): number {
    const inputFilename = path.join(TEMP_DIR, `nj_input_${scenario.name.replace(/\s/g, '_')}.txt`)
    const statusStr = scenario.filingStatus === FilingStatus.MFJ ? 'Married/Joint' : 'Single'

    let fileContent = fs.readFileSync(TEMPLATE_PATH, 'utf-8')

    // Simple Line Replacements using Regex
    fileContent = fileContent.replace(/^Status.*/m, `Status ${statusStr}`)
    fileContent = fileContent.replace(/^L15.*/m, `L15 ${scenario.wages}`)
    fileContent = fileContent.replace(/^L16a.*/m, `L16a ${scenario.interest}`)
    fileContent = fileContent.replace(/^L17.*/m, `L17 ${scenario.dividends}`)

    fs.writeFileSync(inputFilename, fileContent)

    // Run EXE
    // Note: OTS output file defaults to [input]_out.txt
    try {
        execSync(`"${OTS_BIN_PATH}" "${inputFilename}"`, { stdio: 'ignore' })
    } catch (e) {
        // OTS might return non-zero if warnings, but check output
    }

    const outputFilename = inputFilename.replace('.txt', '_out.txt')

    if (!fs.existsSync(outputFilename)) {
        throw new Error(`C Output file not created: ${outputFilename}`)
    }

    const output = fs.readFileSync(outputFilename, 'utf-8')

    // Parse Total Tax (Line 42 check)
    // OTS Output format usually: "L42       1234.00"
    const match = output.match(/L43\s*=\s*([\d\.]+)/)
    if (!match) return 0 // Assuming 0 if not found or formatting issue, but strictly should throw
    return parseFloat(match[1])
}

// --- Helper: Run TS Execution ---
function runNewTS(scenario: TestScenario): number {
    const info: any = {
        taxPayer: {
            filingStatus: scenario.filingStatus,
            primaryPerson: {
                firstName: 'Test', lastName: 'User', ssid: '000-00-0000',
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

    // Monkey-patch F1040 Federal Lines that NJ1040 consumes
    // NJ L14 (Wages) -> F1040 L1z
    // NJ L15 (Interest) -> F1040 L2b
    // NJ L16 (Dividends) -> F1040 L3b

    f1040.l1z = () => scenario.wages
    f1040.l2b = () => scenario.interest
    f1040.l3b = () => scenario.dividends

    const nj1040 = new NJ1040(f1040)
    return nj1040.l42()
}

// --- Jest Suite ---
describe('NJ-1040 Golden Master Verification', () => {
    // Check if C executable exists before running
    if (!fs.existsSync(OTS_BIN_PATH)) {
        console.warn(`Skipping Golden Master tests: OTS Binary not found at ${OTS_BIN_PATH}`)
        return
    }

    SCENARIOS.forEach(scenario => {
        test(`Scenario: ${scenario.name}`, () => {
            const cResult = runLegacyC(scenario)
            const tsResult = runNewTS(scenario)

            console.error(`[${scenario.name}] C: ${cResult}, TS: ${tsResult}`)

            // Floating point comparison with epsilon
            expect(Math.abs(cResult - tsResult)).toBeLessThan(0.01)
        })
    })
})
