'use client';

import React, { useState, FormEvent, useEffect, useRef  } from 'react';
import { useRouter , usePathname} from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Using path alias
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error: authError, errorSource, user ,clearError } = useAuth(); 
  const pathname = usePathname();
  const mountedPathname = useRef(pathname);
  const router = useRouter();
  const hasSubmittedOnThisPageRef = useRef(false);

  
  useEffect(() => {
    // Only clear error if we're navigating from a different page
    if (pathname !== mountedPathname.current && authError) {
      clearError();
    }
    mountedPathname.current = pathname;

    // Don't clear error on unmount to prevent flash
    return () => {
      // Only clear if we're actually navigating away
      if (pathname !== mountedPathname.current) {
        clearError();
      }
    };
  }, [pathname, authError, clearError]);

  // Redirect if user is already logged in (after initial auth check is done)
  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/my-urls'); 
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await login(email, password); // login now sets its own isLoading and clears error
    if (success) {
      router.push('/my-urls'); 
    }
  };
  
  // If initial auth state is loading, show a spinner
  if (isLoading && !user && !authError) { 
    // This condition tries to show loader only during the initial check if no user/error yet
    // The isLoading from useAuth() is true during initial load AND during login API call.
    // A more distinct "isAuthInitialized" state in AuthContext might be cleaner.
    // For now, this will show spinner during login API call too.
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If user is loaded and present, this component shouldn't render the form (useEffect handles redirect)
  // This prevents a "flash" of the form.
  if (user) {
      return ( // Or just null, but a loader gives feedback if redirect is slow
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress /> 
          <Typography sx={{ml: 2}}>Redirecting...</Typography>
        </Box>
      );
  }
  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ marginTop: 8, padding: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (authError && errorSource === 'login') clearError();
            }}
            disabled={isLoading} // Disabled during login API call
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (authError && errorSource === 'login') clearError();
            }}
            disabled={isLoading} // Disabled during login API call
          />
          {authError && errorSource === 'login' && (
            <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>
              {authError}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading} // Disabled during login API call
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/register" passHref onClick={clearError}>
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