import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9333ea', // purple-600
      light: '#a855f7', // purple-500
      dark: '#7c3aed', // purple-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb', // blue-600
      light: '#3b82f6', // blue-500
      dark: '#1d4ed8', // blue-700
      contrastText: '#ffffff',
    },
    background: {
      default: 'linear-gradient(145deg, rgba(27, 24, 24, 1) 1%, rgba(57, 48, 48, 1) 100%)',
      paper: 'rgba(42, 42, 42, 0.5)', // neutral-800/50
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(229, 229, 229, 0.8)', // neutral-200
      disabled: 'rgba(163, 163, 163, 0.5)', // neutral-400/50
    },
    divider: 'rgba(163, 163, 163, 0.3)', // neutral-600
    action: {
      active: 'rgba(229, 229, 229, 0.54)',
      hover: 'rgba(229, 229, 229, 0.08)',
      selected: 'rgba(229, 229, 229, 0.16)',
      disabled: 'rgba(229, 229, 229, 0.26)',
      disabledBackground: 'rgba(229, 229, 229, 0.12)',
    },
    success: {
      main: '#22c55e', // green-500
      light: '#4ade80', // green-400
      dark: '#16a34a', // green-600
    },
    info: {
      main: '#3b82f6', // blue-500
      light: '#60a5fa', // blue-400
      dark: '#2563eb', // blue-600
    },
    error: {
      main: '#ef4444', // red-500
      light: '#f87171', // red-400
      dark: '#dc2626', // red-600
    },
    warning: {
      main: '#f59e0b', // amber-500
      light: '#fbbf24', // amber-400
      dark: '#d97706', // amber-600
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 400,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(145deg, rgba(27, 24, 24, 1) 1%, rgba(57, 48, 48, 1) 100%)',
          backgroundAttachment: 'fixed',
          paddingTop: '72px',
          color: '#ffffff',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        } as React.CSSProperties,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(to right, #9333ea, #2563eb)',
          '&:hover': {
            background: 'linear-gradient(to right, #a855f7, #3b82f6)',
          },
          '&:disabled': {
            background: 'rgba(163, 163, 163, 0.26)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(42, 42, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(163, 163, 163, 0.3)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(23, 23, 23, 0.8)',
            '& fieldset': {
              borderColor: 'rgba(163, 163, 163, 0.5)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(163, 163, 163, 0.7)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2563eb',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(23, 23, 23, 0.8)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(163, 163, 163, 0.5)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(163, 163, 163, 0.7)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563eb',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(-90deg, rgba(27, 24, 24, 1) 1%, rgba(57, 48, 48, 1) 100%)',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(42, 42, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(163, 163, 163, 0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          color: '#93c5fd',
          border: '1px solid rgba(59, 130, 246, 0.3)',
        },
      },
    },
  },
});
