import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useAppSelector } from '../../core/store/hooks.js'; 
import { useDispatch } from 'react-redux';
import { logout } from '../state/authSlice';
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
  const dispatch = useDispatch();

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

  useEffect(() => {
    // If Redux thinks we're logged in, but localStorage is missing the token, force logout
    if (user && token && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('authToken');
      if (!storedToken) {
        dispatch(logout());
      }
    }
  }, [user, token, dispatch, location]);

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