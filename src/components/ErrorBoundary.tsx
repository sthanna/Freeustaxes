
import React, { Component, ReactNode } from 'react'
import { Box, Button, Typography, Container, Paper } from '@material-ui/core'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    handleReset = () => {
        localStorage.clear()
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <Container maxWidth="sm" style={{ marginTop: '2rem' }}>
                    <Paper elevation={3} style={{ padding: '2rem', textAlign: 'center', borderRadius: '16px' }}>
                        <Typography variant="h4" gutterBottom style={{ color: '#E88F7A', fontWeight: 'bold' }}>
                            Something went wrong
                        </Typography>
                        <Typography variant="body1" paragraph>
                            We encountered an unexpected error. This is likely due to old data in your browser from a previous version of the app.
                        </Typography>
                        <Box mt={3} p={2} bgcolor="#f5f5f5" borderRadius={8} style={{ overflowX: 'auto', textAlign: 'left' }}>
                            <code style={{ fontSize: '0.85rem', color: '#d32f2f' }}>
                                {this.state.error?.message}
                            </code>
                        </Box>
                        <Box mt={4}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={this.handleReset}
                                style={{ fontWeight: 600 }}
                            >
                                Reset App Data & Reload
                            </Button>
                        </Box>
                    </Paper>
                </Container>
            )
        }

        return this.props.children
    }
}
