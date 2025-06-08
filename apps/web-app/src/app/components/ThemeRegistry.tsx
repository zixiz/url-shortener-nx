'use client';
import React, { useState, useMemo, createContext, useContext, useEffect } from 'react';
import { ThemeProvider, CssBaseline, PaletteMode, useMediaQuery } from '@mui/material';
import { createAppTheme } from '../../theme/theme'; 
import { SnackbarProvider } from '@/context/SnackbarContext';
import { Provider as ReduxProvider } from 'react-redux'; 
import { store } from '../store/store'; 
import { initialAuthCheckCompleted } from '../store/authSlice'; 

interface ThemeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

export const ThemeModeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
};

const THEME_MODE_STORAGE_KEY = 'themeMode';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<PaletteMode>('light'); 

  useEffect(() => {
    let savedMode: PaletteMode | null = null;
    try {
      savedMode = localStorage.getItem(THEME_MODE_STORAGE_KEY) as PaletteMode | null;
    } catch (error) {
      console.warn('Could not access localStorage for theme mode.', error);
    }
    
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    } else {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]); // Re-run if system preference changes and no saved preference

  const themeModeAPI = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          try {
            localStorage.setItem(THEME_MODE_STORAGE_KEY, newMode);
            // For Tailwind's 'class' strategy
            if (newMode === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          } catch (error) {
            console.warn('Could not save theme mode to localStorage.', error);
          }
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );
  
  // Effect to apply Tailwind dark class when mode changes
  // This runs after the initial mode is determined from localStorage/system pref
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);


  const theme = useMemo(() => createAppTheme(themeModeAPI.mode), [themeModeAPI.mode]);

  useEffect(() => {
    store.dispatch(initialAuthCheckCompleted());
  }, []);

  return (
    <ReduxProvider store={store}>
      <ThemeModeContext.Provider value={themeModeAPI}>
          <SnackbarProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {children}
            </ThemeProvider>
          </SnackbarProvider>
      </ThemeModeContext.Provider>
    </ReduxProvider>
  );
}