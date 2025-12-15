import { ReactElement } from 'react'
import { Helmet } from 'react-helmet'
import { Link, Box, Typography, Button, Grid, Container } from '@material-ui/core'
import LanguageIcon from '@material-ui/icons/Language'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import AssignmentIcon from '@material-ui/icons/Assignment'
import PeopleIcon from '@material-ui/icons/People'

import Urls from 'freeustaxes/data/urls'

const urls = {
  repo: 'https://github.com/sthanna/Freeustaxes',
  issues: 'https://github.com/sthanna/Freeustaxes/issues',
  startPage: '/info'
}

export default function GettingStarted(): ReactElement {
  return (
    <>
      <Helmet>
        <title>FreeUStaxes | Your taxes, your control.</title>
      </Helmet>

      {/* Hero Section */}
      <Box style={{
        background: 'transparent',
        padding: '4rem 0',
        textAlign: 'left',
        marginBottom: '2rem',
        position: 'relative'
      }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={5}>
            <Box style={{ width: '50px', height: '4px', background: '#A0BFA3', marginBottom: '1.5rem' }} />
            <Typography variant="h2" style={{ marginBottom: '1rem', color: '#1E3D4A', fontFamily: 'Merriweather, serif', fontSize: '2.8rem', lineHeight: 1.2 }}>
              Your taxes,<br />
              your control.<br />
              File freely.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              href={Urls.taxPayer.info}
              style={{
                fontSize: '1rem',
                padding: '12px 32px',
                borderRadius: '50px',
                marginTop: '1.5rem',
                boxShadow: '0 10px 20px rgba(232, 143, 122, 0.3)'
              }}
            >
              Start My Filing Journey
            </Button>
          </Grid>
          <Grid item xs={12} md={7} style={{ display: 'flex', justifyContent: 'center' }}>
            {/* Abstract Community Illustration */}
            {/* Hero Illustration */}
            <Box style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img
                src="/img/hero.png"
                alt="Community Powered Tax Filing"
                style={{
                  maxWidth: '100%',
                  maxHeight: '600px',
                  objectFit: 'contain',
                  mixBlendMode: 'multiply'
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" style={{ marginBottom: '6rem' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <PeopleIcon style={{ fontSize: '48px', color: '#1E3D4A', marginBottom: '1.5rem' }} />
              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1E3D4A' }}>Community-Driven</Typography>
              <Typography variant="body1" style={{ color: '#546e7a' }}>Built by the people, for the people.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <MenuBookIcon style={{ fontSize: '48px', color: '#1E3D4A', marginBottom: '1.5rem' }} />
              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1E3D4A' }}>Transparent & Open</Typography>
              <Typography variant="body1" style={{ color: '#546e7a' }}>Open source code you can trust.</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box style={{
              background: 'white',
              borderRadius: '24px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <AssignmentIcon style={{ fontSize: '48px', color: '#1E3D4A', marginBottom: '1.5rem' }} />
              <Typography variant="h6" style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#1E3D4A' }}>Simple, User-Focused</Typography>
              <Typography variant="body1" style={{ color: '#546e7a' }}>Designed for clarity and ease of use.</Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer / Links */}
      <Box style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '2rem' }}>
        <Typography variant="h6" style={{ fontWeight: 700, color: '#1E3D4A', display: 'flex', alignItems: 'center' }}>
          <Box component="span" style={{ marginRight: '8px', display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#1E3D4A' }}></Box> FreeUStaxes
        </Typography>
        <Box>
          <Link href={urls.repo} style={{ margin: '0 1rem', fontWeight: 600, color: '#1E3D4A' }}>How it Works</Link>
          <Link href={urls.issues} style={{ margin: '0 1rem', fontWeight: 600, color: '#1E3D4A' }}>Community</Link>
          <Link href={urls.repo} style={{ margin: '0 1rem', fontWeight: 600, color: '#1E3D4A' }}>Contribute</Link>
        </Box>
      </Box>
    </>
  )
}
