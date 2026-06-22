'use client';

import { createTheme } from '@mui/material/styles';
import { palette } from './palette';

export const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500 } },
    },
    MuiCard: {
      styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { width: 260 } },
    },
  },
});
