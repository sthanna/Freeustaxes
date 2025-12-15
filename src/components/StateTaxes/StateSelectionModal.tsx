
import React, { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    TextField
} from '@material-ui/core'
import { State } from 'freeustaxes/core/data'
import { StateReturnMetadata } from '../../core/types/StateUI'

interface StateSelectionModalProps {
    open: boolean
    onClose: () => void
    onSave: (metadata: Partial<StateReturnMetadata>) => void
    existingStates: string[]
}

const ALL_STATES: State[] = [
    // Supported States
    'MA', 'NY', 'NJ', 'PA', 'CA', 'NC', 'OH', 'VA',
    // No Income Tax States
    'AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY'
].sort() as State[]

const StateSelectionModal: React.FC<StateSelectionModalProps> = ({
    open,
    onClose,
    onSave,
    existingStates
}) => {
    const [selectedState, setSelectedState] = useState<State | ''>('')
    const [residencyStatus, setResidencyStatus] = useState<StateReturnMetadata['residencyStatus']>('RESIDENT')
    const [dates, setDates] = useState({ start: '', end: '' })

    const handleSave = () => {
        if (!selectedState) return
        onSave({
            state: selectedState,
            status: 'NOT_STARTED',
            residencyStatus,
            residencyStartDate: dates.start,
            residencyEndDate: dates.end,
            stepsCompleted: {
                residency: true,
                incomeAllocation: false,
                questions: false,
                review: false
            },
            lastModified: new Date().toISOString()
        })
        onClose()
    }

    const availableStates = ALL_STATES.filter(s => !existingStates.includes(s))

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add a State Return</DialogTitle>
            <DialogContent dividers>
                <Box mb={3}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>State to File</InputLabel>
                        <Select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value as State)}
                            label="State to File"
                        >
                            {availableStates.map(s => (
                                <MenuItem key={s} value={s}>{s}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {selectedState && (
                    <Box mt={2}>
                        <Typography variant="subtitle1" gutterBottom>
                            Residency Status for {selectedState}
                        </Typography>
                        <RadioGroup
                            value={residencyStatus}
                            onChange={(e) => setResidencyStatus(e.target.value as any)}
                        >
                            <FormControlLabel
                                value="RESIDENT"
                                control={<Radio color="primary" />}
                                label="Primary Resident (Lived here all year)"
                            />
                            <FormControlLabel
                                value="PART_YEAR"
                                control={<Radio color="primary" />}
                                label="Part-Year Resident (Moved during the year)"
                            />
                            <FormControlLabel
                                value="NON_RESIDENT"
                                control={<Radio color="primary" />}
                                label="Non-Resident (Lived elsewhere, worked here)"
                            />
                        </RadioGroup>
                    </Box>
                )}

                {residencyStatus === 'PART_YEAR' && (
                    <Box mt={2} display="flex" style={{ gap: 16 }}>
                        <TextField
                            label="Move-In Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            onChange={e => setDates({ ...dates, start: e.target.value })}
                        />
                        <TextField
                            label="Move-Out Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            onChange={e => setDates({ ...dates, end: e.target.value })}
                        />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="default">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                    disabled={!selectedState}
                >
                    Add State
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default StateSelectionModal
