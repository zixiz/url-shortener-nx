import { useState, useMemo, createContext, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, PaletteMode, useMediaQuery } from '@mui/material';
import { createAppTheme } from '../theme/theme'; 

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}
export const ThemeModeContext = createContext<ThemeContextType | undefined>(undefined);
export const useThemeMode = () => { 
     const context = useContext(ThemeModeContext);
     if (!context) throw new Error('useThemeMode must be used within its Provider');
     return context;
};
const THEME_MODE_STORAGE_KEY = 'clientAppThemeMode'; // Use a different key for this app

export default function ViteThemeRegistry({ children }: { children: ReactNode }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<PaletteMode>('light');

  useEffect(() => {
    let savedMode: PaletteMode | null = null;
    try { savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY) as PaletteMode | null; } catch (e) {}
    if (savedMode) setMode(savedMode); else setMode(prefersDarkMode ? 'dark' : 'light');
  }, [prefersDarkMode]);

  const themeModeAPI = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => {
        const newMode = prevMode === 'light' ? 'dark' : 'light';
        try { 
          localStorage.setItem(THEME_MODE_STORAGE_KEY, newMode);
          document.documentElement.classList.toggle('dark', newMode === 'dark');
        } catch (e) {}
        return newMode;
      });
    },
    mode,
  }), [mode]);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  const muiTheme = useMemo(() => createAppTheme(themeModeAPI.mode), [themeModeAPI.mode]);

  return (
    <ThemeModeContext.Provider value={themeModeAPI}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeModeContext.Provider>
  );
}