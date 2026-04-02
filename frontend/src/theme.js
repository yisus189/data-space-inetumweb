import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4f7cff',
      contrastText: '#f7f9ff',
    },
    secondary: {
      main: '#8a6bff',
      contrastText: '#f7f9ff',
    },
    background: {
      default: '#070b14',
      paper: '#0f1728',
    },
    text: {
      primary: '#e8eeff',
      secondary: '#9fb0d9',
    },
    divider: 'rgba(159,176,217,0.18)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: {
      fontWeight: 700,
      textTransform: 'none',
      letterSpacing: 0.2,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(159,176,217,0.15)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        containedPrimary: {
          boxShadow: '0 12px 32px rgba(79,124,255,0.24)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
});

export default theme;
