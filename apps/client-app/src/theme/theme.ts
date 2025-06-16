import { createTheme, responsiveFontSizes, PaletteMode } from '@mui/material/styles';
import { blue, deepOrange, grey } from '@mui/material/colors'; 

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: blue[500], 
            light: blue[300],
            dark: blue[700],
          },
          secondary: { 
            main: blue[200], // A lighter, accent blue or another color
          },
          divider: blue[200], // Light blue divider
          background: {
            default: '#ffffff', // Pure white background
            paper: grey[50],    // Very light grey for paper elements like Cards, Paper
          },
          text: {
            primary: grey[900],
            secondary: grey[700], // Darker secondary for better contrast on white
          },
        }
      : {
          primary: deepOrange, 
          divider: deepOrange[700],
          background: {
            default: grey[900], 
            paper: grey[800],   
          },
          text: {
            primary: '#fff',
            secondary: grey[500],
          },
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  
});

export const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme(getDesignTokens(mode));
  theme = responsiveFontSizes(theme);
  return theme;
};