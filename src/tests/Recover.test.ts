import * as fc from 'fast-check'
import * as arbitraries from 'freeustaxes/core/tests/arbitraries'
import { stateToString, stringToState } from 'freeustaxes/redux/fs'

describe('FS Recover / Save', () => {
  it('should restore the same data it created', () => {
    fc.assert(
      fc.property(arbitraries.yearsTaxesState, (state) => {
        expect(stringToState(stateToString(state))).toEqual(state)
      })
    )
  })
})
