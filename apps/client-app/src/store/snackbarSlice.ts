import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertColor } from '@mui/material';

export interface SnackbarMessage {
  message: string;
  severity?: AlertColor; // 'error' | 'warning' | 'info' | 'success'
  duration?: number;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
  duration: number;
}

const initialState: SnackbarState = {
  open: false,
  message: '',
  severity: 'info',
  duration: 6000,
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    showSnackbar: (state, action: PayloadAction<SnackbarMessage>) => {
      state.open = true;
      state.message = action.payload.message;
      state.severity = action.payload.severity || 'info';
      state.duration = action.payload.duration || 6000;
    },
    hideSnackbar: (state) => {
      state.open = false;
    },
  },
});

export const { showSnackbar, hideSnackbar } = snackbarSlice.actions;
export default snackbarSlice.reducer;