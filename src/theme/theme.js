// ============================================================
// Central MUI theme — the application "template".
// Every MUI component renders on-brand by default from here,
// so individual pages no longer need their own CSS.
// ============================================================
import { createTheme } from '@mui/material/styles';
import { colors, fontFamily, radius } from './tokens';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.brand,
      dark: colors.brandDark,
      light: colors.brandLight,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.inkSoft,
      contrastText: '#ffffff',
    },
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.error },
    info: { main: colors.info },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.ink,
      secondary: colors.inkSoft,
    },
    divider: colors.line,
  },

  shape: {
    borderRadius: radius.md,
  },

  typography: {
    fontFamily,
    h1: { fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.15 },
    h2: { fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 },
    h4: { fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    subtitle1: { color: colors.inkSoft, fontWeight: 500 },
    subtitle2: { color: colors.inkSoft, fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.55 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
  },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: radius.md,
          padding: '10px 22px',
          fontSize: '0.95rem',
        },
        containedPrimary: {
          background: `linear-gradient(180deg, ${colors.brand500} 0%, ${colors.brand600} 100%)`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(46,108,59,0.2)',
          '&:hover': {
            background: `linear-gradient(180deg, ${colors.brand400} 0%, ${colors.brand600} 100%)`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 6px 16px rgba(46,108,59,0.28)',
          },
          '&:active': {
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.12)',
          },
        },
        outlinedPrimary: {
          borderColor: colors.brand300,
          color: colors.brand600,
          '&:hover': {
            backgroundColor: colors.brand50,
            borderColor: colors.brand400,
          },
        },
        textPrimary: {
          color: colors.brand600,
          '&:hover': {
            backgroundColor: colors.brand50,
          },
        },
      },
    },

  MuiOutlinedInput: {
  styleOverrides: {
    root: {
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,

      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.brand, // Default Green
      },

      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.brand, // Hover Green
      },

      '&.Mui-focused': {
        backgroundColor: colors.surface,
      },

      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: colors.brand, // Focus Green
        borderWidth: 2,
      },
    },
  },
},

    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': { color: colors.brand },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: radius.lg },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: radius.lg,
          border: `1px solid ${colors.line}`,
          boxShadow: '0 2px 6px rgba(31, 41, 51, 0.06)',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: radius.sm },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: radius.lg,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: radius.md },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
  },
});

export default theme;
