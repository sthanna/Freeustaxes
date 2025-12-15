
import { FormEvent, ReactElement, ReactNode, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { usePager } from './pager'
import Alert from '@material-ui/lab/Alert'
import { useSelector } from 'react-redux'
import { Information, Asset, State, TaxYear } from 'freeustaxes/core/data'
import { YearsTaxesState } from 'freeustaxes/redux'

import yearFormBuilder from 'freeustaxes/forms/YearForms'
import { intentionallyFloat, run, runAsync } from 'freeustaxes/core/util'
import { Box, Button, Typography, Paper, Grid } from '@material-ui/core'
import Summary from './Summary'

import { savePDF } from 'freeustaxes/pdfHandler'
import { generateStateText } from 'freeustaxes/core/stateForms/generateText'
import StateForm from 'freeustaxes/core/stateForms/Form'
import Form from 'freeustaxes/core/irsForms/Form'

interface StateResult {
  forms: StateForm[]
  errors: string[]
}

export default function CreatePDF(): ReactElement {
  const [irsErrors, updateIrsErrors] = useState<string[]>([])
  const [irsForms, updateIrsForms] = useState<Form[]>([])

  // Map of State Code -> Result
  const [stateResults, setStateResults] = useState<Record<string, StateResult>>({})

  const year: TaxYear = useSelector(
    (state: YearsTaxesState) => state.activeYear
  )
  const info: Information = useSelector(
    (state: YearsTaxesState) => state[state.activeYear]
  )

  const assets: Asset<Date>[] = useSelector(
    (state: YearsTaxesState) => state.assets
  )

  useEffect(() => {
    const builder = yearFormBuilder(year, info, assets)
    const f1040Errors = builder.errors()

    updateIrsErrors(f1040Errors)

    // Determine which states to build
    // Use uiState.stateReturns if available (new source), fall back to stateResidencies (legacy)
    let targetStates: string[] = []
    if (info.uiState?.stateReturns) {
      targetStates = Object.keys(info.uiState.stateReturns)
    }

    // Fallback or merge legacy residency if distinct
    if (info.stateResidencies.length > 0) {
      const legacyState = info.stateResidencies[0].state
      if (!targetStates.includes(legacyState)) {
        targetStates.push(legacyState)
      }
    }

    if (f1040Errors.length > 0) {
      // If federal errors, all states fail
      const failedStates: Record<string, StateResult> = {}
      targetStates.forEach(s => {
        failedStates[s] = { forms: [], errors: ['Cannot build state return with IRS errors'] }
      })
      setStateResults(failedStates)
      updateIrsForms([])
    } else {
      // Build Federal
      const irsRes = builder.f1040()
      run(irsRes).fold(updateIrsErrors, (f1040Forms) => {
        updateIrsErrors([])
        updateIrsForms(f1040Forms)
      })

      // Build States
      const results: Record<string, StateResult> = {}

      targetStates.forEach(stateCode => {
        // Create a temporary info object that mocks the residency as this specific state
        // This is necessary because yearFormBuilder/makeStateReturn currently looks at stateResidencies[0]
        const stateInfo = {
          ...info,
          stateResidencies: [{ state: stateCode as State }]
        }

        const stateBuilder = yearFormBuilder(year, stateInfo, assets)
        const stateRes = stateBuilder.makeStateReturn()

        run(stateRes).fold(
          (errs) => { results[stateCode] = { forms: [], errors: errs as string[] } },
          (forms) => { results[stateCode] = { forms, errors: [] } }
        )
      })

      setStateResults(results)
    }
  }, [info, year, assets])

  const lastName = info.taxPayer.primaryPerson?.lastName
  const federalFileName = `${lastName ?? 'Tax'}-1040.pdf`

  const { navButtons } = usePager()

  const federalReturn = async (e: FormEvent<Element>): Promise<void> => {
    e.preventDefault()
    const builder = yearFormBuilder(year, info, assets)

    const r1 = await runAsync(builder.f1040Bytes())
    const r2 = await r1.mapAsync((bytes) => savePDF(bytes, federalFileName))
    return r2.orThrow()
  }

  const generateStateReturn = (stateCode: string) => async (e: FormEvent<Element>): Promise<void> => {
    e.preventDefault()
    // Same logic as useEffect: Mock strict residency for generation
    const stateInfo = {
      ...info,
      stateResidencies: [{ state: stateCode as State }]
    }
    const builder = yearFormBuilder(year, stateInfo, assets)
    const fileName = `${lastName ?? 'StateTax'}-${stateCode}.pdf`

    const r1 = await runAsync(builder.stateReturnBytes())
    const r2 = await r1.mapAsync((bytes) => savePDF(bytes, fileName))
    return r2.orThrow()
  }

  const printActions: ReactNode = (() => {
    if (irsErrors.length === 0) {
      return (
        <>
          <h2>Print Copy to File</h2>
          <h3>Federal</h3>
          <Box marginBottom={2}>
            <Button
              type="button"
              onClick={intentionallyFloat(federalReturn)}
              variant="contained"
              color="primary"
            >
              Create Federal 1040
            </Button>
          </Box>

          {Object.entries(stateResults).map(([stateCode, result]) => (
            <Box key={stateCode} marginBottom={3} border={1} borderColor="grey.300" borderRadius={4} p={2}>
              <h3>State: {stateCode}</h3>
              {result.errors.length === 0 ? (
                <Button
                  type="button"
                  onClick={intentionallyFloat(generateStateReturn(stateCode))}
                  variant="contained"
                  color="primary"
                >
                  Create {stateCode} Return
                </Button>
              ) : (
                result.errors.map((e, idx) => (
                  <Alert key={idx} severity="info" style={{ marginBottom: 8 }}>
                    {e}
                  </Alert>
                ))
              )}
              {result.forms.length > 0 && (
                <Box marginTop={2}>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      const text = generateStateText(result.forms)
                      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${lastName ?? 'StateTax'}-${stateCode}.txt`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    variant="outlined"
                    color="primary"
                  >
                    Download Text Summary (Fallback)
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </>
      )
    }
    return null
  })()

  // Flatten all valid state forms for simple summary passing (though Summary might ignore them)
  const allStateForms = Object.values(stateResults).flatMap(r => r.forms)
  // Flatten errors? 
  // Summary currently takes flat list of stateErrors. We can aggregate.
  const allStateErrors = Object.entries(stateResults).flatMap(([code, r]) => r.errors.map(e => `${code}: ${e}`))

  return (
    <div>
      <Summary
        errors={irsErrors}
        stateErrors={allStateErrors}
        irsForms={irsForms}
        stateForms={allStateForms}
      />
      <form tabIndex={-1}>
        <Helmet>
          <title>Print Copy to File | Results | UsTaxes.org</title>
        </Helmet>
        {printActions}
        {navButtons}
      </form>
    </div>
  )
}
