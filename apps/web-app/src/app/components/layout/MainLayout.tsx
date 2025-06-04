'use client'; 

import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button, CircularProgress } from '@mui/material';
import Link from 'next/link';
import ThemeToggleButton from '../ThemeToggleButton';
import { useAuth } from '@/context/AuthContext'; 

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading: isAuthLoading } = useAuth(); // Get user, logout, and isLoading from AuthContext
  const isAuthenticated = !!user;

  const handleLogout = () => {
    logout();
  };

  if (isAuthLoading) {
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