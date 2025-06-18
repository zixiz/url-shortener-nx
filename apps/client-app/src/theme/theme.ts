import { createTheme, responsiveFontSizes, PaletteMode, Theme } from '@mui/material/styles';

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { // The bright blue/interactive color
            main: '#0b80ee', // Example, take from Stitch's primary action button in dark mode
                           // Or a light mode equivalent if they have one
          },
          secondary: { // A secondary accent
            main: '#dce8f3', // Stitch's light "Sign Up" button background
          },
          background: {
            default: '#f9fafb', // bg-gray-50
            paper: '#ffffff',   // For cards, paper elements if they are whiter
          },
          text: {
            primary: '#101518',   // Main dark text
            secondary: '#5c748a', // Lighter/placeholder text
          },
          divider: '#eaedf1',     // Border color
          action: { // For hover states on buttons etc.
            hoverOpacity: 0.08,
            // hover: 'rgba(0, 0, 0, 0.04)' // Default light hover
          }
        }
      : { // Dark Mode
          primary: {
            main: '#0b80ee', // Stitch's dark mode primary action blue
          },
          secondary: {
            main: '#223649', // Stitch's dark mode secondary button background
          },
          background: {
            default: '#101a23', // Main dark background
            paper: '#182734',   // Darker paper elements (input bg, table header bg)
          },
          text: {
            primary: '#ffffff',
            secondary: '#90aecb', // Lighter/placeholder text for dark mode
          },
          divider: '#223649',     // Darker border color
          action: {
            // hover: 'rgba(255, 255, 255, 0.08)' // Default dark hover
          }
        }),
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans", sans-serif',
    // Consider matching Stitch's font sizes/weights for h1, h2, body1, etc.
  },
  components: { // Global component overrides
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem', // Matches rounded-xl from Tailwind if default is 12px
          textTransform: 'none' as const,   // Stitch buttons don't seem to be all caps
          fontWeight: 'bold',    // Stitch buttons are bold
        },
        // ContainedPrimary might need specific colors if different from theme.primary.main
        containedPrimary: {
          backgroundColor: mode === 'dark' ? '#0b80ee' : '#dce8f3', 
          color: mode === 'dark' ? '#ffffff' : '#101518',
          '&:hover': {
             backgroundColor: mode === 'dark' ? '#0066CC' : '#C5D9E9', // Darker/lighter shade
          }
        },
      }
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: '0.75rem', // If you want all Paper to be rounded-xl
            }
        }
    },
    MuiAppBar: {
        styleOverrides: {
            root: ({ theme }: { theme: Theme }) => ({ // Use callback to access current theme
                backgroundColor: theme.palette.background.paper, // Match paper color
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none' // Stitch header has no shadow, just border
            })
        }
    }
  }
});

export const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme(getDesignTokens(mode));
  theme = responsiveFontSizes(theme); // For responsive typography
  return theme;
};