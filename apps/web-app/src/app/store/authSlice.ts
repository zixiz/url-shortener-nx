import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/lib/apiClient.js'; 

// Define types
interface User {
  id: string;
  email: string;
  username?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean; // For API call status and initial load
  isInitialAuthChecked: boolean; // To track if initial localStorage check is done
  error: string | null;
}

interface AuthResponseData { // Expected from successful login API
  token: string;
  userId: string;
  email: string;
  username?: string | null;
}

interface RegisterResponseData { // Expected from successful register API (if it returns user)
    // For now, our register API doesn't return user, so this might be simpler
    message: string; 
    // user?: User; // If register API returned user data
}

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

// Helper function to get initial state from localStorage
const getInitialAuthState = (): AuthState => {
  let user = null;
  let token = null;
  if (typeof window !== 'undefined') { // Ensure localStorage is available
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
    isLoading: false, // Will be set true by async thunks during API calls
    isInitialAuthChecked: false, // Will be set to true after initial check
    error: null,
  };
};

const initialState: AuthState = getInitialAuthState();

// Async Thunk for Login
export const loginUser = createAsyncThunk<
  AuthResponseData, // Type for the successful return value
  { emailP: string; passwordP: string }, // Type for the arguments passed to the thunk
  { rejectValue: string } // Type for the value returned on rejection
>(
  'auth/loginUser', // Action type prefix
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post<AuthResponseData>('/auth/login', {
        email: credentials.emailP,
        password: credentials.passwordP,
      });
      localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      const userData: User = { id: response.data.userId, email: response.data.email, username: response.data.username };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      return response.data; // This will be the action.payload on success
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      return rejectWithValue(errorMessage); // This will be action.payload on failure
    }
  }
);

// Async Thunk for Registration
export const registerUser = createAsyncThunk<
  RegisterResponseData, // Type for successful return
  { emailP: string; passwordP: string; usernameP?: string },
  { rejectValue: string }
>(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const payload: any = { email: userData.emailP, password: userData.passwordP };
      if (userData.usernameP) payload.username = userData.usernameP;
      const response = await apiClient.post<RegisterResponseData>('/auth/register', payload);
      return response.data; // e.g., { message: "User registered successfully." }
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
    // Reducer for manual logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null; // Clear any errors on logout
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    },
    // Reducer to mark initial auth check as complete
    initialAuthCheckCompleted: (state) => {
        state.isInitialAuthChecked = true;
        // If after check, user/token are still null, ensure isLoading is false
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
      // Login User
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
      // Register User
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state/*, action: PayloadAction<RegisterResponseData>*/) => {
        state.isLoading = false;
        // No user/token state change on register success, user needs to login
        state.error = null; 
        // action.payload contains the success message, e.g., { message: "..." }
        // We could store this message if needed, or handle via Snackbar directly in component
      })
      .addCase(registerUser.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed with an unknown error.';
      });
  },
});

export const { logout, initialAuthCheckCompleted, clearAuthError } = authSlice.actions;
export default authSlice.reducer;