import { generateStateText } from '../generateText'
import Form from '../Form'
import { ValidatedInformation } from '../../../forms/F1040Base'
import { State } from '../../data'

class MockForm extends Form {
    state: State = 'IL'
    formName = 'MockForm'
    formOrder = 0
    info = {} as ValidatedInformation

    attachments = () => []
    fields = () => []

    // Mock Data Methods
    l1 = () => 1000
    l2 = () => 500
    CheckBox1 = () => true
    name = () => 'John Doe'
    complexCalc = () => this.l1() + this.l2()
}

describe('generateStateText', () => {
    it('should generate a text summary of the form', () => {
        const form = new MockForm()
        const text = generateStateText([form])

        console.log(text)

        expect(text).toContain('FORM: MockForm (IL)')
        expect(text).toContain('l1: 1000')
        expect(text).toContain('l2: 500')
        expect(text).toContain('CheckBox1: [X]')
        expect(text).toContain('name: John Doe')
        expect(text).toContain('complexCalc: 1500')

        // Should exclude base props
        expect(text).not.toContain('formName: MockForm') // Explicitly checked we skip specific props in the loop output formatted line
        expect(text).not.toContain('info:')
    })
})
