
import React, { useState, useEffect } from 'react'
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Grid,
    InputAdornment,
    Button,
    Divider
} from '@material-ui/core'
import { Information } from 'freeustaxes/core/data'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import SaveIcon from '@material-ui/icons/Save'

interface IncomeAllocationProps {
    info: Information
    stateCode: string
    initialAllocations: Record<string, number>
    onSave: (allocations: Record<string, number>) => void
    onBack: () => void
}

const IncomeAllocation: React.FC<IncomeAllocationProps> = ({
    info,
    stateCode,
    initialAllocations,
    onSave,
    onBack
}) => {
    const [allocations, setAllocations] = useState<Record<string, number>>(initialAllocations || {})

    // Helper to update allocation
    const handleChange = (key: string, value: string, max: number) => {
        const num = parseFloat(value)
        if (isNaN(num)) return
        // Allow user to type, but warn if > max? Or clamp?
        // Let's just store simple number.
        setAllocations(prev => ({ ...prev, [key]: num }))
    }

    const w2s = info.w2s || []
    const f1099s = info.f1099s || []

    return (
        <Box>
            <Box mb={3} display="flex" alignItems="center">
                <Button startIcon={<ArrowBackIcon />} onClick={onBack} style={{ marginRight: 16 }}>
                    Back
                </Button>
                <Typography variant="h5" style={{ fontFamily: 'Merriweather', color: '#1E3D4A' }}>
                    Income Allocation: {stateCode}
                </Typography>
            </Box>

            <Typography variant="body1" paragraph>
                Please confirm or adjust the amount of income that is taxable in <strong>{stateCode}</strong>.
            </Typography>

            {/* W2 Section */}
            {w2s.length > 0 && (
                <Box mb={4}>
                    <Typography variant="h6" gutterBottom style={{ color: '#1E3D4A' }}>
                        W-2 Income (Wages)
                    </Typography>
                    {w2s.map((w2, index) => {
                        const key = `w2-${index}`
                        const fedAmount = w2.income || 0
                        const stateAmount = allocations[key] ?? fedAmount // Default to full amount if not set
                        const percent = fedAmount > 0 ? ((stateAmount / fedAmount) * 100).toFixed(1) : '0'

                        return (
                            <Card key={key} variant="outlined" style={{ marginBottom: 16 }}>
                                <CardContent>
                                    <Grid container spacing={3} alignItems="center">
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="subtitle2" color="textSecondary">Employer</Typography>
                                            <Typography variant="body1" style={{ fontWeight: 600 }}>W2 #{index + 1}</Typography>
                                            <Typography variant="caption">Federal: ${fedAmount.toLocaleString()}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                label={`Taxable in ${stateCode}`}
                                                variant="outlined"
                                                fullWidth
                                                type="number"
                                                value={stateAmount}
                                                onChange={(e) => handleChange(key, e.target.value, fedAmount)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box textAlign="center">
                                                <Typography variant="h4" color={parseFloat(percent) > 100 ? 'error' : 'primary'}>
                                                    {percent}%
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Allocated
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )
                    })}
                </Box>
            )}

            {/* 1099 Section */}
            {f1099s.length > 0 && (
                <Box mb={4}>
                    <Divider style={{ marginBottom: 24 }} />
                    <Typography variant="h6" gutterBottom style={{ color: '#1E3D4A' }}>
                        1099 Income
                    </Typography>
                    {f1099s.map((f, index) => {
                        const key = `1099-${index}`
                         // Basic access, simplified
                        const fedAmount = (f.form as any).income || (f.form as any).taxableAmount || 0
                        const stateAmount = allocations[key] ?? fedAmount
                        const percent = fedAmount > 0 ? ((stateAmount / fedAmount) * 100).toFixed(1) : '0'

                        return (
                            <Card key={key} variant="outlined" style={{ marginBottom: 16 }}>
                                <CardContent>
                                    <Grid container spacing={3} alignItems="center">
                                        <Grid item xs={12} sm={4}>
                                            <Typography variant="subtitle2" color="textSecondary">Payer</Typography>
                                            <Typography variant="body1" style={{ fontWeight: 600 }}>{f.type}</Typography>
                                            <Typography variant="caption">Federal: ${fedAmount.toLocaleString()}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                label={`Taxable in ${stateCode}`}
                                                variant="outlined"
                                                fullWidth
                                                type="number"
                                                value={stateAmount}
                                                onChange={(e) => handleChange(key, e.target.value, fedAmount)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box textAlign="center">
                                                 <Typography variant="h4" color={parseFloat(percent) > 100 ? 'error' : 'primary'}>
                                                    {percent}%
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Allocated
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )
                    })}
                </Box>
            )}

            <Box mt={4} textAlign="right">
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={() => onSave(allocations)}
                >
                    Save Allocation
                </Button>
            </Box>
        </Box>
    )
}

export default IncomeAllocation
