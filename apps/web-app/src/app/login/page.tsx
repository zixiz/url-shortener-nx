// apps/web-app/src/app/login/page.tsx
'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '../store/hooks'; // Path to your typed hooks
import { loginUser, clearAuthError } from '../store/authSlice'; // Import thunk and clearAuthError action
import {
  Container, Box, TextField, Button, Typography,
  CircularProgress, Alert, Paper
} from '@mui/material';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageError, setPageError] = useState<string | null>(null); // Local error for this form

  const dispatch = useAppDispatch();
  const router = useRouter();

  // Get relevant state from Redux store
  const { user, isLoading: isAuthApiLoading, error: authApiError, isInitialAuthChecked } = useAppSelector((state) => state.auth);

  // Clear Redux auth error when component mounts if it's from a different source/page
  useEffect(() => {
    // console.log("LoginPage Mounted. Current Redux authApiError:", authApiError);
    if (authApiError) { // If there's a global auth error when loading this page
      dispatch(clearAuthError()); // Clear it from Redux state
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // Run once on mount

  // Redirect if user is already logged in (after initial Redux state is checked)
  useEffect(() => {
    if (isInitialAuthChecked && user) {
      router.replace('/my-urls'); 
    }
  }, [user, isInitialAuthChecked, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError(null); // Clear local page error

    const resultAction = await dispatch(loginUser({ emailP: email, passwordP: password }));

    if (loginUser.fulfilled.match(resultAction)) {
      // Successful login, Redux state is updated, useEffect above will redirect
      // No need for router.push('/my-urls') here as useEffect handles it.
    } else if (loginUser.rejected.match(resultAction)) {
      setPageError(resultAction.payload || "Login failed. Please try again.");
    }
  };
  
  // Loading states
  if (!isInitialAuthChecked) { // Waiting for Redux to confirm initial auth status
    return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box> );
  }
  if (isInitialAuthChecked && user) { // User is logged in, redirecting
    return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /><Typography sx={{ml: 2}}>Redirecting...</Typography></Box> );
  }

  // If initial check done and no user, render the form
  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign In</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField margin="normal" required fullWidth id="email" label="Email Address" value={email} onChange={(e) => { setEmail(e.target.value); setPageError(null); }} disabled={isAuthApiLoading} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setPageError(null);}} disabled={isAuthApiLoading} />
          
          {pageError && (
            <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>{pageError}</Alert>
          )}
          
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={isAuthApiLoading}>
            {isAuthApiLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link 
              href="/register" 
              passHref 
              onClick={() => { // Clear current page's error when navigating
                setPageError(null); 
                dispatch(clearAuthError()); // Also clear global Redux error
              }}
            >
              <Typography component="span" variant="body2" sx={{ cursor: 'pointer' }}>
                {"Don't have an account? Sign Up"}
              </Typography>
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}