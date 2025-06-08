'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface SnackbarMessage {
  message: string;
  severity?: AlertColor; // 'error' | 'warning' | 'info' | 'success'
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (options: SnackbarMessage) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [snackbarConfig, setSnackbarConfig] = useState<SnackbarMessage>({
    message: '',
    severity: 'info',
    duration: 6000, 
  });

  const showSnackbar = useCallback((options: SnackbarMessage) => {
    setSnackbarConfig({
      message: options.message,
      severity: options.severity || 'info',
      duration: options.duration || 6000,
    });
    setOpen(true);
  }, []);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={snackbarConfig.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} 
      >
        <Alert onClose={handleClose} severity={snackbarConfig.severity} sx={{ width: '100%' }} variant="filled">
          {snackbarConfig.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};