
import React from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Typography,
    Chip,
    IconButton
} from '@material-ui/core'
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline'
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked'
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from '@material-ui/icons/Delete'
import { StateReturnMetadata } from '../../core/types/StateUI'
import { Information } from 'freeustaxes/core/data'

interface StateDashboardProps {
    info: Information
    onAddState: () => void
    onEditState: (stateCode: string) => void
    onDeleteState: (stateCode: string) => void
}

const StateDashboard: React.FC<StateDashboardProps> = ({
    info,
    onAddState,
    onEditState,
    onDeleteState
}) => {
    const uiState = info.uiState || { stateReturns: {} }
    const stateReturns = Object.values(uiState.stateReturns)

    // Calculate Fed Status (Mock for now, normally derived from form)
    const fedRefund = 0 // info.refund?.refundAmount || 0
    const fedOwed = 0 // info.refund?.amountOwed || 0

    return (
        <Box>
            {/* Header / Fed Summary */}
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h4" style={{ fontFamily: 'Merriweather', color: '#1E3D4A' }}>
                    State Taxes
                </Typography>
                <Card variant="outlined" style={{ minWidth: 200, borderColor: '#e0e0e0' }}>
                    <CardContent style={{ padding: '16px' }}>
                        <Typography variant="caption" color="textSecondary" display="block">
                            FEDERAL RETURN
                        </Typography>
                        {fedRefund > 0 ? (
                            <Typography variant="h6" style={{ color: '#2e7d32' }}>
                                +${fedRefund.toLocaleString()} Refund
                            </Typography>
                        ) : fedOwed > 0 ? (
                            <Typography variant="h6" style={{ color: '#d32f2f' }}>
                                -${fedOwed.toLocaleString()} Owed
                            </Typography>
                        ) : (
                            <Typography variant="h6" color="textPrimary">
                                $0.00
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* State List */}
            <Grid container spacing={3}>
                {stateReturns.map((stateMeta: StateReturnMetadata) => (
                    <Grid item xs={12} key={stateMeta.state}>
                        <Card elevation={2} style={{ borderRadius: 12 }}>
                            <CardContent>
                                <Grid container alignItems="center" spacing={2}>
                                    <Grid item>
                                        <Box
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                borderRadius: '50%',
                                                backgroundColor: '#E3F2FD',
                                                color: '#1976D2',
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            {stateMeta.state}
                                        </Box>
                                    </Grid>
                                    <Grid item xs>
                                        <Typography variant="h6" style={{ fontWeight: 600 }}>
                                            {stateMeta.state} State Return
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {stateMeta.residencyStatus === 'RESIDENT'
                                                ? 'Resident'
                                                : stateMeta.residencyStatus === 'PART_YEAR'
                                                    ? 'Part-Year Resident'
                                                    : 'Non-Resident'}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <Chip
                                            icon={
                                                stateMeta.status === 'READY_TO_FILE' ? (
                                                    <CheckCircleIcon />
                                                ) : (
                                                    <RadioButtonUncheckedIcon />
                                                )
                                            }
                                            label={stateMeta.status.replace('_', ' ')}
                                            color={stateMeta.status === 'READY_TO_FILE' ? 'primary' : 'default'}
                                            variant="outlined"
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<EditIcon />}
                                            onClick={() => onEditState(stateMeta.state)}
                                        >
                                            Continue
                                        </Button>
                                    </Grid>
                                    <Grid item>
                                        <IconButton onClick={() => onDeleteState(stateMeta.state)}>
                                            <DeleteIcon color="action" />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {/* Add State Button */}
                <Grid item xs={12}>
                    <Button
                        fullWidth
                        variant="outlined"
                        style={{
                            borderStyle: 'dashed',
                            borderWidth: 2,
                            borderColor: '#bdbdbd',
                            padding: '24px',
                            color: '#616161',
                            borderRadius: 12
                        }}
                        startIcon={<AddCircleOutlineIcon style={{ fontSize: 32 }} />}
                        onClick={onAddState}
                    >
                        <Typography variant="h6">Add Another State</Typography>
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}

export default StateDashboard
