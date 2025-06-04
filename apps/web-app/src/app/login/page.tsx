'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For redirection in App Router
import { useAuth } from '@/context/AuthContext'; // Assuming path alias is set up
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
  const { login, isLoading, error: authError, user } = useAuth(); // Get login function and auth state
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      router.push('/my-urls'); // Or '/' or wherever you want to redirect after login
    }
    // Error will be displayed via authError state
  };

  // If user is already logged in, redirect them (optional, good UX)
  useEffect(() => {
    if (user) {
      router.replace('/my-urls'); // Or home page
    }
  }, [user, router]);


  if (isLoading && !authError && !user) { // Show loading indicator if loading initial auth state and not yet logged in
      // This initial loading is handled by AuthContext, this check is more for login process
      // For initial page load, a different kind of full page loader might be better if needed
  }
  
  // If user becomes defined (meaning login was successful via context update), this component will re-render.
  // The useEffect above will then handle the redirect.

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
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
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
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          {authError && (
            <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>
              {authError}
            </Alert>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/register" passHref>
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