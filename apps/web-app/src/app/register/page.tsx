'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { registerUser, clearAuthError } from '../store/authSlice';
import { useSnackbar } from '@/context/SnackbarContext';
import {
  Container, Box, TextField, Button, Typography,
  CircularProgress, Alert, Paper
} from '@mui/material';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientFormError, setClientFormError] = useState<string | null>(null);
  const [apiPageError, setApiPageError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const { user, isLoading: isAuthApiLoading, error: authApiErrorFromSlice, isInitialAuthChecked } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (authApiErrorFromSlice) {
      dispatch(clearAuthError());
    }
  }, [dispatch]);

  useEffect(() => {
    if (isInitialAuthChecked && user) {
      router.replace('/my-urls');
    }
  }, [user, isInitialAuthChecked, router]);

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
      showSnackbar({ message: 'Registration successful! Please log in.', severity: 'success' });
      router.push('/login');
    } else if (registerUser.rejected.match(resultAction)) {
      setApiPageError(resultAction.payload || "Registration failed. Please try again.");
    }
  };

  if (!isInitialAuthChecked) {
    return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box> );
  }
  if (isInitialAuthChecked && user) {
    return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /><Typography sx={{ml: 2}}>Redirecting...</Typography></Box> );
  }
    return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, /* ... */ }}>
        <Typography component="h1" variant="h5">Sign Up</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
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
            <Link 
              href="/login" 
              passHref
              onClick={() => { 
                setClientFormError(null);
                setApiPageError(null);
                dispatch(clearAuthError());
              }}
            >
              <Typography component="span" variant="body2" sx={{ cursor: 'pointer' }}>
                {"Already have an account? Sign In"}
              </Typography>
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}