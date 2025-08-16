import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../core/lib/apiClient'; 

interface User {
  id: string;
  email: string;
  username?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean; 
  isInitialAuthChecked: boolean; 
  error: string | null;
}

interface AuthResponseData {
  token: string;
  userId: string;
  email: string;
  username?: string | null;
}

interface RegisterResponseData { 
    message: string; 
}

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

const getInitialAuthState = (): AuthState => {
  let user = null;
  let token = null;
  if (typeof window !== 'undefined') {
    const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const persistedUserJson = localStorage.getItem(AUTH_USER_KEY);
    if (persistedToken && persistedUserJson) {
      try {
        user = JSON.parse(persistedUserJson) as User;
        token = persistedToken;
      } catch (e) {
        console.error("AuthSlice: Failed to parse persisted auth data", e);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
  }
  return {
    user,
    token,
    isLoading: false,
    isInitialAuthChecked: false,
    error: null,
  };
};

const initialState: AuthState = getInitialAuthState();

export const loginUser = createAsyncThunk<
  AuthResponseData,
  { emailP: string; passwordP: string },
  { rejectValue: string }
>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<AuthResponseData>('/auth/login', {
        email: credentials.emailP,
        password: credentials.passwordP,
      });
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      const userData: User = { id: response.data.userId, email: response.data.email, username: response.data.username };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerUser = createAsyncThunk<
  RegisterResponseData,
  { emailP: string; passwordP: string; usernameP?: string },
  { rejectValue: string }
>(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const payload: any = { email: userData.emailP, password: userData.passwordP };
      if (userData.usernameP) payload.username = userData.usernameP;
      const response = await apiClient.post<RegisterResponseData>('/auth/register', payload);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    },
    initialAuthCheckCompleted: (state) => {
        state.isInitialAuthChecked = true;
        if (!state.user || !state.token) {
            state.isLoading = false; 
        }
    },
    clearAuthError: (state) => {
        state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponseData>) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = {
          id: action.payload.userId,
          email: action.payload.email,
          username: action.payload.username,
        };
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed with an unknown error.';
        state.user = null;
        state.token = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state/*, action: PayloadAction<RegisterResponseData>*/) => {
        state.isLoading = false;
        state.error = null; 
      })
      .addCase(registerUser.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed with an unknown error.';
      });
  },
});

export const { logout, initialAuthCheckCompleted, clearAuthError } = authSlice.actions;
export default authSlice.reducer;