import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  // Add responsive breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Modern blue
      dark: '#1d4ed8',
      light: '#3b82f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed', // Purple
      dark: '#6d28d9',
      light: '#8b5cf6',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Emerald
      dark: '#059669',
      light: '#34d399',
    },
    warning: {
      main: '#f59e0b', // Amber
      dark: '#d97706',
      light: '#fbbf24',
    },
    error: {
      main: '#ef4444', // Red
      dark: '#dc2626',
      light: '#f87171',
    },
    info: {
      main: '#06b6d4', // Cyan
      dark: '#0891b2',
      light: '#22d3ee',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '-0.025em',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1rem',
      },
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '0.875rem',
      },
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      '@media (max-width:600px)': {
        fontSize: '0.75rem',
      },
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.025em',
      '@media (max-width:600px)': {
        fontSize: '0.8rem',
      },
    },
  },
  shape: {
    borderRadius: 2,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    ...Array(19).fill('0px 25px 50px -12px rgba(0, 0, 0, 0.25)')
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          border: '1px solid #e2e8f0',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          backgroundImage: 'none',
        },
        outlined: {
          border: '1px solid #e2e8f0',
        },
        elevation1: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '& fieldset': {
              borderColor: '#e2e8f0',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: '#cbd5e1',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
              borderColor: '#2563eb',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          fontWeight: 500,
        },
        standardInfo: {
          backgroundColor: '#eff6ff',
          color: '#1e40af',
          border: '1px solid #bfdbfe',
        },
        standardSuccess: {
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
        },
        standardWarning: {
          backgroundColor: '#fffbeb',
          color: '#92400e',
          border: '1px solid #fde68a',
        },
        standardError: {
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 48,
          '&.Mui-selected': {
            color: '#2563eb',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0 16px 16px 0',
          border: 'none',
          boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 2,
          boxShadow: '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1e293b',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            fontWeight: 500,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 2,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 2,
          boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: '#f1f5f9',
          },
          '&.Mui-selected': {
            backgroundColor: '#eff6ff',
            '&:hover': {
              backgroundColor: '#dbeafe',
            },
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          margin: '2px',
          '&:hover': {
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          '& .MuiButton-root': {
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.75rem',
            '@media (max-width:600px)': {
              fontSize: '0.65rem',
              padding: '6px 8px',
            },
          },
        },
        grouped: {
          '&:not(:last-of-type)': {
            borderColor: 'inherit',
          },
        },
      },
    },
  },
});

export default theme;
