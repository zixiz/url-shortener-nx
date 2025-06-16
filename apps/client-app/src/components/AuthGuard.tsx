
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useAppSelector } from '../store/hooks.js'; 
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const pathname = location.pathname;

  // Select auth state from Redux store
  const { user, token, isInitialAuthChecked } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialAuthChecked) {
      return; 
    }
    if (!user && !token) { 
      if (pathname !== '/login' && pathname !== '/register') {
        navigate('/login', { replace: true }); 
      }
    }
  }, [user, token, isInitialAuthChecked, navigate, pathname]); 

  if (!isInitialAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
        <Typography sx={{ml: 2}}>Verifying authentication...</Typography>
      </Box>
    );
  }

  if (user && token) { 
    return <>{children}</>; 
  }
  
  if (pathname !== '/login' && pathname !== '/register') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
        <Typography sx={{ml: 2}}>Redirecting to login...</Typography>
      </Box>
    );
  }
  return null; 
}