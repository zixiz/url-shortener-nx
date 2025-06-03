import { createTheme, responsiveFontSizes, PaletteMode } from '@mui/material/styles';
import { amber, deepOrange, grey } from '@mui/material/colors';

// Function to get the theme configuration
export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Palette values for light mode
          primary: amber,
          divider: amber[200],
          text: {
            primary: grey[900],
            secondary: grey[800],
          },
          background: {
            default: '#fff', // Or grey[50]
            paper: grey[100],
          },
        }
      : {
          // Palette values for dark mode
          primary: deepOrange,
          divider: deepOrange[700],
          background: {
            default: grey[900], // Or deepOrange[900]
            paper: grey[800],   // Or deepOrange[800]
          },
          text: {
            primary: '#fff',
            secondary: grey[500],
          },
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // You can customize typography further here
  },
  // You can customize other theme aspects like spacing, breakpoints, components defaults
});

// A function to create the theme, making it responsive
export const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme(getDesignTokens(mode));
  theme = responsiveFontSizes(theme);
  return theme;
};