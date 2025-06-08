'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '../app/store/hooks'; 
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Select auth state from Redux store
  const { user, token, isInitialAuthChecked } = useAppSelector((state) => state.auth);

  useEffect(() => {

    if (!isInitialAuthChecked) {
      return; 
    }

    if (!user) { 
      if (pathname !== '/login' && pathname !== '/register') {
        router.replace('/login'); 
      }
    }
  }, [user, token, isInitialAuthChecked, router, pathname]); // Added token for completeness, though user check is primary

  if (!isInitialAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
        <Typography sx={{ml: 2}}>Verifying authentication...</Typography>
      </Box>
    );
  }

  if (user) {
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