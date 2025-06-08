'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector } from '../app/store/hooks'; // Use typed Redux hook (ensure path is correct)
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
    // console.log(`AuthGuard Effect: Path: ${pathname}, InitialChecked: ${isInitialAuthChecked}, User: ${!!user}`);

    // Only act once the initial auth check from localStorage (handled by authSlice) is complete.
    if (!isInitialAuthChecked) {
      return; // Still loading initial auth state, do nothing yet.
    }

    // If initial check is done, and we're not authenticated
    if (!user) { // Checking for user object is sufficient if token is set along with user
      // And we are not on a public auth page already
      if (pathname !== '/login' && pathname !== '/register') {
        // console.log(`AuthGuard: Not authenticated after initial check, redirecting to /login from ${pathname}`);
        router.replace('/login'); 
      }
    }
  }, [user, token, isInitialAuthChecked, router, pathname]); // Added token for completeness, though user check is primary

  // Scenario 1: Initial auth state is still being determined by Redux store
  if (!isInitialAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
        <Typography sx={{ml: 2}}>Verifying authentication...</Typography>
      </Box>
    );
  }

  // Scenario 2: Initial check done, user is authenticated (user object exists)
  if (user) {
    return <>{children}</>;
  }
  
  // Scenario 3: Initial check done, user is NOT authenticated
  // If on a protected route (not login/register), useEffect above handles redirect. Show loader.
  if (pathname !== '/login' && pathname !== '/register') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
        <Typography sx={{ml: 2}}>Redirecting to login...</Typography>
      </Box>
    );
  }
  
  // If on login/register and not authenticated, AuthGuard should effectively do nothing here,
  // allowing the login/register pages to render.
  return null; 
}