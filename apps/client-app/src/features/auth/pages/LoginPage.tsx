'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom'; // Use react-router-dom
import { useAppSelector, useAppDispatch } from '../../core/store/hooks.js';
import { loginUser, clearAuthError } from '../state/authSlice.js'; 
import {
  Container, Box, TextField, Button, Typography,
  CircularProgress, Alert, Paper, Link as MuiLink
} from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pageError, setPageError] = useState<string | null>(null); 

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, isLoading: isAuthApiLoading, error: authApiError, isInitialAuthChecked } = useAppSelector((state) => state.auth);

  
  useEffect(() => {
    if (authApiError) { 
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
    setPageError(null);

    const resultAction = await dispatch(loginUser({ emailP: email, passwordP: password }));

    if (loginUser.fulfilled.match(resultAction)) {
      // Successful login, Redux state is updated, useEffect above will redirect
      // No need for router.push('/my-urls') here as useEffect handles it.
    } else if (loginUser.rejected.match(resultAction)) {
      setPageError(resultAction.payload || "Login failed. Please try again.");
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
            <MuiLink component={RouterLink} to="/register" variant="body2" sx={{ display: 'block', mb: 1 }}>
              <Typography component="span" variant="body2" sx={{ cursor: 'pointer' }} onClick={() => { 
                setEmail('');
                setPassword('');
                setPageError(null);
                dispatch(clearAuthError());
              }}>
                {"Don't have an account? Sign Up"}
              </Typography>
            </MuiLink>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}