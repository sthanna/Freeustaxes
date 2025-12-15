import { ReactElement } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { usePager } from 'freeustaxes/components/pager'
import { EstimatedTaxPayments, TaxYear } from 'freeustaxes/core/data'
import { YearsTaxesState } from 'freeustaxes/redux'
import { Currency, LabeledInput } from 'freeustaxes/components/input'
import { Patterns } from 'freeustaxes/components/Patterns'
import { FormListContainer } from 'freeustaxes/components/FormContainer'
import { Grid } from '@material-ui/core'
import { Work } from '@material-ui/icons'
import {
  addEstimatedPayment,
  editEstimatedPayment,
  removeEstimatedPayment
} from 'freeustaxes/redux/actions'
import { useDispatch } from 'freeustaxes/redux'
import { useSelector } from 'react-redux'
import { useYearSelector } from 'freeustaxes/redux/yearDispatch'

interface EstimatedTaxesUserInput {
  label: string
  payment: string
}

const blankUserInput: EstimatedTaxesUserInput = {
  label: '',
  payment: ''
}

const toPayments = (
  formData: EstimatedTaxesUserInput
): EstimatedTaxPayments => ({
  ...formData,
  // Note we are not error checking here because
  // we are already in the input validated happy path
  // of handleSubmit.
  label: formData.label,
  payment: parseInt(formData.payment)
})

const toEstimatedTaxesUserInput = (
  data: EstimatedTaxPayments
): EstimatedTaxesUserInput => ({
  ...blankUserInput,
  ...data,
  label: data.label,
  payment: data.payment.toString()
})

export default function EstimatedTaxes(): ReactElement {
  const defaultValues = blankUserInput
  const activeYear: TaxYear = useSelector(
    (state: YearsTaxesState) => state.activeYear
  )

  const estimatedTaxes = useYearSelector(
    (state) => state.information.estimatedTaxes
  )

  const dispatch = useDispatch()

  const methods = useForm<EstimatedTaxesUserInput>({ defaultValues })

  const { navButtons, onAdvance } = usePager()

  const onSubmitAdd = (formData: EstimatedTaxesUserInput): void => {
    dispatch(addEstimatedPayment(toPayments(formData)))
  }

  const onSubmitEdit =
    (index: number) =>
    (formData: EstimatedTaxesUserInput): void => {
      dispatch(editEstimatedPayment({ index, value: toPayments(formData) }))
    }

  const w2sBlock = (
    <FormListContainer<EstimatedTaxesUserInput>
      defaultValues={defaultValues}
      items={estimatedTaxes.map((a) => toEstimatedTaxesUserInput(a))}
      onSubmitAdd={onSubmitAdd}
      onSubmitEdit={onSubmitEdit}
      removeItem={(i) => dispatch(removeEstimatedPayment(i))}
      icon={() => <Work />}
      primary={(estimatedTaxes: EstimatedTaxesUserInput) =>
        estimatedTaxes.label
      }
      secondary={(estimatedTaxes: EstimatedTaxesUserInput) => (
        <span>
          Payment: <Currency value={toPayments(estimatedTaxes).payment} />
        </span>
      )}
    >
      <Grid container spacing={2}>
        <LabeledInput
          name="label"
          label="label or date of this payment"
          patternConfig={Patterns.plain}
          sizes={{ xs: 12, lg: 6 }}
        />
        <LabeledInput
          name="payment"
          label="Estimated tax payment"
          patternConfig={Patterns.currency}
          sizes={{ xs: 12, lg: 6 }}
        />
      </Grid>
    </FormListContainer>
  )

  const form: ReactElement = <>{w2sBlock}</>

  return (
    <form tabIndex={-1} onSubmit={onAdvance}>
      <h2>Estimated Taxes</h2>
      <p>
        Did you already make payments towards your {activeYear} taxes this year
        or last year?
      </p>
      <FormProvider {...methods}>{form}</FormProvider>
      {navButtons}
    </form>
  )
}
