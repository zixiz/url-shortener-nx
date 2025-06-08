'use client'; 

import React, { useEffect } from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, CircularProgress } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggleButton from '../ThemeToggleButton';
import { useAppSelector, useAppDispatch } from '../../store/hooks'; 
import { logout as logoutAction, initialAuthCheckCompleted } from '../../store/authSlice';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { user, isInitialAuthChecked } = useAppSelector((state) => state.auth);
  const isAuthenticated = !!user; 

  // This useEffect in ThemeRegistry is now primary for dispatching initialAuthCheckCompleted.
  // Keeping a similar check here can be a safeguard if ThemeRegistry's effect order is different.
  // However, ideally, it's dispatched once.
  useEffect(() => {
      if(!isInitialAuthChecked) {
          // console.log("MainLayout: isInitialAuthChecked is false, dispatching initialAuthCheckCompleted");
          // dispatch(initialAuthCheckCompleted()); // Dispatching from ThemeRegistry is likely sufficient
      }
    }, [dispatch, isInitialAuthChecked]);


  const handleLogout = () => {
    dispatch(logoutAction()); 
    router.push('/'); 
  };

  // If initial auth state hasn't been checked yet by Redux, show a full page loader.
  // This prevents UI flash.
  if (!isInitialAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
              URL Shorty
            </Link>
          </Typography>
          
          <Button color="inherit" component={Link} href="/">Home</Button>
          
          {!isAuthenticated && (
            <>
              <Button color="inherit" component={Link} href="/login">Login</Button>
              <Button color="inherit" component={Link} href="/register">Register</Button>
            </>
          )}

          {isAuthenticated && (
            <>
              <Button color="inherit" component={Link} href="/my-urls">My URLs</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button> 
            </>
          )}
          
          <Button color="inherit" component={Link} href="/stats">Stats</Button>

          <ThemeToggleButton />
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ py: 3, flexGrow: 1 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} URL Shortener App
        </Typography>
      </Box>
    </Box>
  );
}