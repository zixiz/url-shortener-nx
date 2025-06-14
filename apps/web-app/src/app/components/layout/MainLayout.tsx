'use client'; 

import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button, 
  CircularProgress,
  IconButton,     
  Drawer,         
  List,           
  ListItem,       
  ListItemButton, 
  ListItemText,   
  Divider,        
  useTheme,       
  useMediaQuery   
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggleButton from '../ThemeToggleButton'; 
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout as logoutAction, initialAuthCheckCompleted } from '../../store/authSlice';
import MenuIcon from '@mui/icons-material/Menu';

const NAV_ITEMS_PUBLIC = [
  { text: 'Home', href: '/' },
  { text: 'Login', href: '/login' },
  { text: 'Register', href: '/register' },
  { text: 'Stats', href: '/stats' },
];

const NAV_ITEMS_AUTHENTICATED = [
  { text: 'Home', href: '/' },
  { text: 'My URLs', href: '/my-urls' },
  { text: 'Stats', href: '/stats' },
];

const DRAWER_WIDTH = 240;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const { user, isInitialAuthChecked } = useAppSelector((state) => state.auth);
  const isAuthenticated = !!user; 

  const [mobileOpen, setMobileOpen] = useState(false);

  // This useEffect in ThemeRegistry is primary for dispatching initialAuthCheckCompleted.
  // This can be a safeguard or removed if ThemeRegistry handles it reliably.
  // useEffect(() => {
  //     if(!isInitialAuthChecked && typeof window !== 'undefined') { // Check window for client-side only
  //         // console.log("MainLayout: isInitialAuthChecked is false, dispatching initialAuthCheckCompleted");
  //         // dispatch(initialAuthCheckCompleted()); // Dispatching from ThemeRegistry is likely sufficient and better
  //     }
  //   }, [dispatch, isInitialAuthChecked]);


  const handleLogout = () => {
    dispatch(logoutAction()); 
    router.push('/'); 
  };

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const navItemsToDisplay = isAuthenticated ? NAV_ITEMS_AUTHENTICATED : NAV_ITEMS_PUBLIC;

  const drawerContent = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', width: DRAWER_WIDTH }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        URL Shorty Menu
      </Typography>
      <Divider />
      <List>
        {navItemsToDisplay.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} href={item.href} sx={{ textAlign: 'left', pl: 3 }}>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        {isAuthenticated && (
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ textAlign: 'left', pl: 3 }}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  // If initial auth state hasn't been checked yet by Redux, show a full page loader.
  if (!isInitialAuthChecked) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar component="nav" position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 1 }} // Adjusted margin
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              // Hide title on xs screens if menu icon is shown, to give more space to other icons
              display: (isMobile && navItemsToDisplay.length > 1) ? 'none' : 'block', 
              sm: 'block' 
            }} 
          >
            <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
              URL Shorty
            </Link>
          </Typography>
          
          {/* Desktop Navigation Links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navItemsToDisplay.map((item) => (
                <Button key={item.text} color="inherit" component={Link} href={item.href}>
                  {item.text}
                </Button>
              ))}
              {isAuthenticated && (
                <Button color="inherit" onClick={handleLogout}>Logout</Button> 
              )}
            </Box>
          )}
          <Box sx={{ ml: isMobile ? 'auto' : 1 }}> {/* Ensure toggle is pushed right */}
             <ThemeToggleButton />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' }, // Show only on xs, hide on sm and up
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>
      
      <Container component="main" sx={{ py: 3, flexGrow: 1 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.mode === 'light'
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