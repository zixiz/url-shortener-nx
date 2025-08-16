'use client';

import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4'; 
import Brightness7Icon from '@mui/icons-material/Brightness7'; 
import { useThemeMode } from './ViteThemeRegistry'; 

export default function ThemeToggleButton() {
  const { mode, toggleColorMode } = useThemeMode();

  return (
    <Tooltip title={mode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
        {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
}