'use client';

import { createTheme, alpha } from '@mui/material/styles';
import { palette, tokens } from './palette';

export const theme = createTheme({
  palette,
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h4: { fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.02em', lineHeight: 1.3 },
    h5: { fontWeight: 700, fontSize: '1.375rem', letterSpacing: '-0.01em', lineHeight: 1.3 },
    h6: { fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.01em', lineHeight: 1.4 },
    subtitle1: { fontWeight: 500, fontSize: '1rem', lineHeight: 1.5 },
    subtitle2: { fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.5 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: palette.text.secondary },
    overline: { fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
    ...Array(19).fill('0 25px 50px -12px rgb(0 0 0 / 0.15)'),
  ] as unknown as typeof createTheme extends (o: infer O) => unknown ? O extends { shadows?: infer S } ? S : never : never,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: '6px', height: '6px' },
          '&::-webkit-scrollbar-thumb': { borderRadius: '3px', background: '#CBD5E1' },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          padding: '8px 16px',
          borderRadius: '8px',
          transition: 'all 0.15s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
          '&:hover': { 
            transform: 'translateY(-1px)', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
          },
        },
        outlined: {
          borderColor: palette.divider,
          '&:hover': { borderColor: palette.text.secondary, backgroundColor: alpha(palette.primary.main, 0.04) },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${palette.divider}`,
          borderRadius: '12px',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': { borderColor: '#CBD5E1' },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: '0.75rem', height: 24, borderRadius: '6px' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: palette.text.secondary,
            backgroundColor: tokens.surface.sunken,
            borderBottom: `1px solid ${palette.divider}`,
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 },
          '&.MuiTableRow-hover:hover': { backgroundColor: tokens.surface.sunken },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { 
          padding: '14px 16px', 
          fontSize: '0.8125rem',
          borderBottom: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            fontSize: '0.8125rem',
            '& fieldset': { borderColor: palette.divider },
            '&:hover fieldset': { borderColor: '#CBD5E1' },
            '&.Mui-focused fieldset': { borderColor: palette.secondary.main, borderWidth: '1.5px' },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          minHeight: 44,
          padding: '10px 16px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 2, borderRadius: '1px 1px 0 0' },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: { width: 260 } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: '10px', fontSize: '0.8125rem' },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: '8px' },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: { fontSize: '0.8125rem', borderTop: `1px solid ${palette.divider}` },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

export { tokens };
