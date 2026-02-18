import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#003b6f', // Azul oscuro (Inetum color base)
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00c3b0', // Azul agua marina (Inetum color secundario)
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5', // Fondo claro
      paper: '#ffffff',  // Fondos de tarjetas/paneles
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

export default theme;