'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import { Box, CircularProgress, Typography } from '@mui/material';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading: isAuthLoading, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // console.log('AuthGuard: isLoading:', isAuthLoading, 'user:', !!user, 'token:', !!token, 'pathname:', pathname);

    // If initial auth check is done, and there's no user/token,
    // and we are not already on the login page (to prevent redirect loop)
    if (!isAuthLoading && !user && !token) {
      if (pathname !== '/login') {
        // console.log('AuthGuard: Not authenticated, redirecting to /login from', pathname);
        // Store the intended path to redirect back after login (optional)
        // localStorage.setItem('redirectAfterLogin', pathname);
        router.replace('/login'); 
      }
    }
  }, [user, isAuthLoading, token, router, pathname]);

  // While initial auth state is loading, show a loader
  if (isAuthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' /* Adjust height if AppBar is present */ }}>
        <CircularProgress />
        <Typography sx={{ml: 2}}>Verifying authentication...</Typography>
      </Box>
    );
  }

  // If authenticated, render the children (the protected page)
  if (user && token) {
    return <>{children}</>;
  }
  
  // If not loading and not authenticated, and we're trying to render a protected route that's not login,
  // this will show a brief loader while the useEffect above triggers the redirect.
  // This prevents rendering children if user is null after loading.
  // Or, if we are on /login already, this guard shouldn't be used there, or it should allow /login.
  // The useEffect handles the redirect, so this return path is mainly for the loading phase.
  // If somehow useEffect redirect fails, this acts as a fallback.
  if (pathname !== '/login') { // Avoid rendering anything if about to redirect from a protected page
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
            <CircularProgress />
            <Typography sx={{ml: 2}}>Redirecting to login...</Typography>
        </Box>
      );
  }

  return null; // Or some fallback if on /login page and this guard was mistakenly used.
               // Ideally, AuthGuard is not used on public pages like /login.
}