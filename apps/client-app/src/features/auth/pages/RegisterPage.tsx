'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // react-router-dom imports
import { useAppSelector, useAppDispatch } from '../../core/store/hooks.js';
import { registerUser, clearAuthError } from '../state/authSlice.js';
import { showSnackbar } from '../../core/store/uiSlice';
import LoadingIndicator from '../../core/components/LoadingIndicator';
import AuthFormContainer from '../components/AuthFormContainer';
import { Box, TextField, Button, CircularProgress, Alert, Typography, Link as MuiLink } from '@mui/material';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [apiPageError, setApiPageError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, isLoading: isAuthApiLoading, error: authApiErrorFromSlice } = useAppSelector((state) => state.auth);
  const { isInitialAuthChecked } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (authApiErrorFromSlice) {
      dispatch(clearAuthError());
    }
  }, [dispatch]);

  useEffect(() => {
    if (isInitialAuthChecked && user) {
      navigate('/my-urls', { replace: true });
    }
  }, [user, isInitialAuthChecked, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClientFormError(null);
    setApiPageError(null);

    if (password !== confirmPassword) {
      setClientFormError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setClientFormError("Password must be at least 8 characters long.");
      return;
    }

    const effectiveUsername = username.trim() === '' ? undefined : username.trim();
    const resultAction = await dispatch(registerUser({ emailP: email, passwordP: password, usernameP: effectiveUsername }));

    if (registerUser.fulfilled.match(resultAction)) {
      dispatch(showSnackbar({ message: 'Registration successful! Please log in.', severity: 'success' }));
      navigate('/login');
    } else if (registerUser.rejected.match(resultAction)) {
      setApiPageError(resultAction.payload || "Registration failed. Please try again.");
    }
  };

  if (!isInitialAuthChecked) {
    return <LoadingIndicator />;
  }
  if (isInitialAuthChecked && user) {
    return <LoadingIndicator message="Redirecting..." />;
  }
    return (
    <AuthFormContainer title="Sign Up" onSubmit={handleSubmit}>
      {/* TextFields for email, username, password, confirmPassword */}
      <TextField margin="normal" required fullWidth id="email" label="Email Address" value={email} onChange={(e) => { setEmail(e.target.value); setApiPageError(null); }} disabled={isAuthApiLoading} /* ... */ />
      <TextField margin="normal" fullWidth id="username" value={username} label="Username" onChange={(e) => { setUsername(e.target.value); setApiPageError(null); }} disabled={isAuthApiLoading} /* ... */ />
      <TextField margin="normal" required fullWidth type="password" name="password" label="Password" value={password} onChange={(e) => { setPassword(e.target.value); setClientFormError(null); setApiPageError(null); }} disabled={isAuthApiLoading} /* ... */ />
      <TextField margin="normal" required fullWidth type="password" name="confirmPassword" label="Confirm Password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setClientFormError(null); setApiPageError(null); }} disabled={isAuthApiLoading} error={!!clientFormError && clientFormError.includes("Passwords do not match")} /* ... */ />

      {clientFormError && (
        <Alert severity="warning" sx={{ width: '100%', mt: 2, mb: 1 }}>{clientFormError}</Alert>
      )}
      {apiPageError && !clientFormError && (
        <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>{apiPageError}</Alert>
      )}
      
      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isAuthApiLoading}>
        {isAuthApiLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
      </Button>
      <Box sx={{ textAlign: 'center' }}>
        <MuiLink component={RouterLink} to="/login" variant="body2" sx={{ display: 'block', mb: 1 }}>
          <Typography component="span" variant="body2" sx={{ cursor: 'pointer' }} onClick={() => { 
            setClientFormError(null);
            setApiPageError(null);
            dispatch(clearAuthError());
          }}>
            {"Already have an account? Sign In"}
          </Typography>
        </MuiLink>
      </Box>
    </AuthFormContainer>
  );
}