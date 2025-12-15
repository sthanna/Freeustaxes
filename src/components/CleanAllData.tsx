
import React from 'react'
import { Button, Container, Typography, Box } from '@material-ui/core'
import { DeleteForever } from '@material-ui/icons'

const CleanAllData = (): React.ReactElement => {
    const handleClean = () => {
        localStorage.clear()
        window.location.reload()
    }

    return (
        <Container maxWidth="md">
            <Box mt={4} textAlign="center">
                <Typography variant="h4" gutterBottom>
                    Reset Application Data
                </Typography>
                <Typography variant="body1" paragraph>
                    This will delete all your entered data and reset the application to its initial state.
                    Use this if you want to start over completely.
                </Typography>
                <Typography variant="body1" color="error" paragraph>
                    <strong>Warning: This action cannot be undone.</strong>
                </Typography>
                <Box mt={4}>
                    <Button
                        variant="contained"
                        color="secondary"
                        size="large"
                        startIcon={<DeleteForever />}
                        onClick={handleClean}
                    >
                        Clean All Data
                    </Button>
                </Box>
            </Box>
        </Container>
    )
}

export default CleanAllData
