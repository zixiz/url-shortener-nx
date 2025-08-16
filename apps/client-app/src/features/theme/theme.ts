import { createTheme, responsiveFontSizes, PaletteMode, Theme } from '@mui/material/styles';

export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#0b80ee',
          },
          secondary: {
            main: '#dce8f3',
          },
          background: {
            default: '#f9fafb',
            paper: '#ffffff',
          },
          text: {
            primary: '#101518',
            secondary: '#5c748a',
          },
          divider: '#eaedf1',
          action: {
            hoverOpacity: 0.08,
            hover: 'rgba(0, 0, 0, 0.04)' 
          }
        }
      : { 
          primary: {
            main: '#0b80ee',
          },
          secondary: {
            main: '#223649',
          },
          background: {
            default: '#101a23',
            paper: '#182734',
          },
          text: {
            primary: '#ffffff',
            secondary: '#90aecb',
          },
          divider: '#223649',
          action: {
            hover: 'rgba(255, 255, 255, 0.08)' 
          }
        }),
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.75rem',
          textTransform: 'none' as const, 
          fontWeight: 'bold',
        },
        containedPrimary: {
          backgroundColor: mode === 'dark' ? '#0b80ee' : '#dce8f3', 
          color: mode === 'dark' ? '#ffffff' : '#101518',
          '&:hover': {
             backgroundColor: mode === 'dark' ? '#0066CC' : '#C5D9E9',
          }
        },
      }
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                borderRadius: '0.75rem',
            }
        }
    },
    MuiAppBar: {
        styleOverrides: {
            root: ({ theme }: { theme: Theme }) => ({
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none'
            })
        }
    }
  }
});

export const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme(getDesignTokens(mode));
  theme = responsiveFontSizes(theme);
  return theme;
};