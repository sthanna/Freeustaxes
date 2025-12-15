import { ReactElement, useMemo } from 'react'
import Main from './components/Main'
import './App.css'
import { createTheme, ThemeProvider, useMediaQuery } from '@material-ui/core'
import { ErrorBoundary } from './components/ErrorBoundary'

const App = (): ReactElement => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: '#E88F7A', // Coral (Buttons)
            contrastText: '#ffffff'
          },
          secondary: {
            main: '#1E3D4A', // Deep Teal
            contrastText: '#ffffff'
          },
          background: {
            default: '#F9F9F7', // Light Cream
            paper: '#ffffff'
          },
          text: {
            primary: '#1E3D4A', // Deep Teal
            secondary: '#546e7a'
          }
        },
        typography: {
          fontFamily: "'Inter', sans-serif",
          h1: {
            fontFamily: "'Merriweather', serif",
            fontWeight: 700
          },
          h2: {
            fontFamily: "'Merriweather', serif",
            fontWeight: 700
          },
          h3: {
            fontFamily: "'Merriweather', serif",
            fontWeight: 700
          },
          button: {
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            textTransform: 'none'
          }
        },
        shape: {
          borderRadius: 16
        },
        overrides: {
          MuiButton: {
            root: {
              borderRadius: 50
            }
          },
          MuiPaper: {
            rounded: {
              borderRadius: 24
            }
          },
          MuiAppBar: {
            colorPrimary: {
              backgroundColor: '#1E3D4A' // Deep Teal Header
            }
          }
        }
      }),
    []
  )

  return (
    <div className="App">
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <Main />
        </ErrorBoundary>
      </ThemeProvider>
    </div>
  )
}

export default App
