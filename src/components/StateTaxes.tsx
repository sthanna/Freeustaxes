
import React, { ReactElement, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useSelector, useDispatch } from 'react-redux'
import { Information, State } from 'freeustaxes/core/data'
import { YearsTaxesState } from 'freeustaxes/redux'
import { setInfo } from 'freeustaxes/redux/actions'
import { Container } from '@material-ui/core'
import StateDashboard from './StateTaxes/Dashboard'
import StateSelectionModal from './StateTaxes/StateSelectionModal'
import IncomeAllocation from './StateTaxes/IncomeAllocation'
import { StateReturnMetadata } from 'freeustaxes/core/types/StateUI'

// View State Enum
type ViewState = 'DASHBOARD' | 'ALLOCATION' | 'FORM_RENDERER'

export default function StateTaxes(): ReactElement {
    const year = useSelector((state: YearsTaxesState) => state.activeYear)
    const info: Information = useSelector((state: YearsTaxesState) => state[state.activeYear])
    const dispatch = useDispatch()

    const [view, setView] = useState<ViewState>('DASHBOARD')
    const [activeStateCode, setActiveStateCode] = useState<string>('')
    const [isAddModalOpen, setAddModalOpen] = useState(false)

    // Helper to update Info
    const handleUpdateInfo = (newInfo: Information) => {
        dispatch(setInfo(newInfo)(year))
    }

    const handleAddState = (metadata: Partial<StateReturnMetadata>) => {
        if (!metadata.state) return
        const currentUI = info.uiState || { stateReturns: {} }

        const newUI = {
            ...currentUI,
            stateReturns: {
                ...currentUI.stateReturns,
                [metadata.state]: metadata as StateReturnMetadata
            }
        }

        // Also ensure State Residency is added to core data
        const currentResidencies = info.stateResidencies || []
        const newResidencies = [...currentResidencies]
        if (!newResidencies.find(r => r.state === metadata.state)) {
            newResidencies.push({ state: metadata.state as State })
        }

        handleUpdateInfo({
            ...info,
            uiState: newUI,
            stateResidencies: newResidencies
        })
    }

    const handleDeleteState = (stateCode: string) => {
        const currentUI = info.uiState || { stateReturns: {} }
        const newReturns = { ...currentUI.stateReturns }
        delete newReturns[stateCode]

        handleUpdateInfo({
            ...info,
            uiState: { ...currentUI, stateReturns: newReturns },
            stateResidencies: info.stateResidencies.filter(r => r.state !== stateCode)
        })
    }

    const handleEditState = (stateCode: string) => {
        setActiveStateCode(stateCode)
        // Logic to determine where to go? 
        // For MVP, go to Income Allocation first.
        setView('ALLOCATION')
    }

    const handleSaveAllocations = (allocations: Record<string, number>) => {
        if (!activeStateCode) return
        const currentUI = info.uiState || { stateReturns: {} }
        const meta = currentUI.stateReturns[activeStateCode]

        if (meta) {
            const newMeta = { ...meta, allocations, status: 'IN_PROGRESS' as const }
            const newUI = {
                ...currentUI,
                stateReturns: {
                    ...currentUI.stateReturns,
                    [activeStateCode]: newMeta
                }
            }
            handleUpdateInfo({ ...info, uiState: newUI })
            // Return to Dashboard
            setView('DASHBOARD')
        }
    }

    return (
        <Container maxWidth="md">
            <Helmet>
                <title>State Taxes | FreeUStaxes</title>
            </Helmet>

            {view === 'DASHBOARD' && (
                <>
                    <StateDashboard
                        info={info}
                        onAddState={() => setAddModalOpen(true)}
                        onEditState={handleEditState}
                        onDeleteState={handleDeleteState}
                    />
                    <StateSelectionModal
                        open={isAddModalOpen}
                        onClose={() => setAddModalOpen(false)}
                        onSave={handleAddState}
                        existingStates={Object.keys(info.uiState?.stateReturns || {})}
                    />
                </>
            )}

            {view === 'ALLOCATION' && (
                <IncomeAllocation
                    info={info}
                    stateCode={activeStateCode}
                    initialAllocations={info.uiState?.stateReturns[activeStateCode]?.allocations || {}}
                    onSave={handleSaveAllocations}
                    onBack={() => setView('DASHBOARD')}
                />
            )}
        </Container>
    )
}
