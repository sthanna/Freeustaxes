import { screen } from '@testing-library/react'
import Menu, { drawerSections } from 'freeustaxes/components/Menu'
import { renderWithProviders } from 'freeustaxes/testUtil'
import { Provider } from 'react-redux'
import { createWholeStoreUnpersisted } from 'freeustaxes/redux/store'
import { blankYearTaxesState } from 'freeustaxes/redux'

const heading = drawerSections[0].title
const blankStore = createWholeStoreUnpersisted(blankYearTaxesState)

const component = (
  <Provider store={blankStore}>
    <Menu />
  </Provider>
)

describe('Menu', () => {
  describe('desktop view', () => {
    it('renders', () => {
      renderWithProviders(component)
      expect(screen.getByText(heading)).toBeInTheDocument()
    })
  })
})
