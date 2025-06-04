'use client';

import React, { useState, FormEvent, useEffect, useRef  } from 'react';
import { useRouter, usePathname  } from 'next/navigation';
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

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const pathname = usePathname();
  const mountedPathname = useRef(pathname);

  // isLoading from useAuth now represents *both* initial load and API call loading
  const { register, isLoading, error: authError, user, clearError } = useAuth();
  const router = useRouter();

    useEffect(() => {
    // If the pathname we are currently on is different from the one when this effect was last set up for a path change,
    // AND an error exists, it means we navigated here with a stale error.
    if (pathname !== mountedPathname.current && authError) {
      // console.log(`Navigated to ${pathname} from ${mountedPathname.current}, clearing stale error: ${authError}`);
      clearError();
    }
    mountedPathname.current = pathname; // Update for the next potential path change
  }, [pathname, authError, clearError]); // Rerun if path changes or if authError changes

  // Redirect if user is already logged in (after initial auth check is done)
  useEffect(() => {
    if (!isLoading && user) { // Check !isLoading to avoid redirect during initial auth load
      router.replace('/my-urls');
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null); 

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    const effectiveUsername = username.trim() === '' ? undefined : username.trim();
    const success = await register(email, password, effectiveUsername); // register now sets its own isLoading
    if (success) {
      alert('Registration successful! Please log in.');
      router.push('/login');
    }
  };
  
  // If initial auth state is loading, show a spinner
  if (isLoading && !user && !authError) {
    // This condition might still show spinner during register API call
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If user is loaded and present, this component shouldn't render the form
  if (user) {
      return (
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
          Sign Up
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
            disabled={isLoading} // Disabled during register API call
          />
          <TextField
            margin="normal"
            fullWidth
            id="username"
            label="Username (Optional)"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading} // Disabled during register API call
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password (min. 8 characters)"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading} // Disabled during register API call
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading} // Disabled during register API call
            error={!!formError && formError.includes("Passwords do not match")}
          />

          {formError && (
            <Alert severity="warning" sx={{ width: '100%', mt: 2, mb: 1 }}>
              {formError}
            </Alert>
          )}
          {authError && !formError && (
            <Alert severity="error" sx={{ width: '100%', mt: 2, mb: 1 }}>
              {authError}
            </Alert>
          )}
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading} // Disabled during register API call
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="/login" passHref>
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