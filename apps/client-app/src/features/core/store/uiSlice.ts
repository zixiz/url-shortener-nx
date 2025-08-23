import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  duration: number | null;
}

interface UiState {
  isInitialAuthChecked: boolean;
  snackbar: SnackbarState;
}

const initialState: UiState = {
  isInitialAuthChecked: false,
  snackbar: {
    open: false,
    message: '',
    severity: 'info',
    duration: 3000,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setInitialAuthChecked: (state, action: PayloadAction<boolean>) => {
      state.isInitialAuthChecked = action.payload;
    },
    showSnackbar: (state, action: PayloadAction<Partial<SnackbarState>>) => {
      state.snackbar = {
        ...state.snackbar,
        ...action.payload,
        open: true,
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.open = false;
    },
  },
});

export const { setInitialAuthChecked, showSnackbar, hideSnackbar } = uiSlice.actions;
export default uiSlice.reducer;
