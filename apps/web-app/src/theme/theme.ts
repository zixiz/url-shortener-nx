// apps/web-app/src/theme/theme.ts
import { createTheme, responsiveFontSizes, PaletteMode } from '@mui/material/styles';
// Import blue for light mode, keep deepOrange or choose another for dark mode primary
import { blue, deepOrange, grey } from '@mui/material/colors'; 

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Palette values for light mode
          primary: {
            main: blue[500], // Main light blue
            light: blue[300],
            dark: blue[700],
          },
          secondary: { // You might want a secondary color too
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
          // Palette values for dark mode (current deepOrange or customize as well)
          primary: deepOrange, // Or another color like a darker blue or cyan
          // secondary: cyan, // Example for dark mode secondary
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
  // You can also customize component defaults here
  // components: {
  //   MuiAppBar: {
  //     styleOverrides: {
  //       root: ({ theme }) => ({
  //         backgroundColor: theme.palette.mode === 'light' ? blue[600] : theme.palette.background.paper,
  //       }),
  //     },
  //   },
  // },
});

export const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme(getDesignTokens(mode));
  theme = responsiveFontSizes(theme);
  return theme;
};