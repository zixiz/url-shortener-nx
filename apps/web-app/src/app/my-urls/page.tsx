// apps/web-app/src/app/my-urls/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
// Corrected AuthGuard import path assuming it's in src/app/components/
import AuthGuard from '../../components/AuthGuard'; // Adjust path as necessary
import {
  Typography, Container, Box, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, Paper, Divider, Link as MuiLink,
  Skeleton 
} from '@mui/material';
import Link from 'next/link'; 
// Redux Hooks
import { useAppSelector } from '../store/hooks'; // Adjust path to your typed Redux hooks
import apiClient from '../../lib/apiClient'; // Adjust path to your API client
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSnackbar } from '../../context/SnackbarContext';

interface ShortenedUrl {
  id: string;
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  clickCount: number;
  createdAt: string;
  userId?: string | null; // This will match the authenticated user's ID
}

export default function MyUrlsPage() {
  // Get auth state from Redux store
  const { user, token, isInitialAuthChecked } = useAppSelector((state) => state.auth); 

  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true); // Loading state specifically for fetching these URLs
  const [errorFetchingUrls, setErrorFetchingUrls] = useState<string | null>(null);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchUrls = async () => {
      // Token is essential for this authenticated endpoint
      if (!token) { 
        setIsLoadingUrls(false);
        // AuthGuard should ideally prevent reaching here if not authenticated.
        // If somehow reached, set an error or handle appropriately.
        // setErrorFetchingUrls("Authentication token not found. Please log in.");
        return;
      }

      setIsLoadingUrls(true);
      setErrorFetchingUrls(null);
      try {
        // apiClient will automatically include the Authorization header with the token
        const response = await apiClient.get<ShortenedUrl[]>('/urls/mine');
        setUrls(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch your URLs.';
        setErrorFetchingUrls(errorMessage);
        console.error("Error fetching user URLs:", err);
      } finally {
        setIsLoadingUrls(false);
      }
    };

    // Fetch URLs only when initial auth check by Redux is complete AND a token is present.
    // The `user` object check is also good to ensure user data is loaded.
    if (isInitialAuthChecked && token && user) {
      fetchUrls();
    } else if (isInitialAuthChecked && (!token || !user)) {
      // If auth check is done but user is not properly authenticated (no token/user),
      // don't attempt to fetch. AuthGuard should have redirected.
      setIsLoadingUrls(false); 
    }
    // If !isInitialAuthChecked, we wait for Redux to finish its initial state hydration.
  }, [token, user, isInitialAuthChecked]); // Depend on these Redux state pieces

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showSnackbar({ message: 'Short URL copied to clipboard!', severity: 'success', duration: 3000 }))
      .catch(err => {
        console.error('Failed to copy to clipboard:', err);
        showSnackbar({ message: 'Failed to copy URL.', severity: 'error' });
      });
  };

  // Function to render skeleton placeholders
  const renderSkeletons = () => (
    <Paper elevation={2} sx={{ mt: 2 }}>
      <List dense>
        {[...Array(3)].map((_, index) => (
          <React.Fragment key={`skeleton-${index}`}>
            <ListItem sx={{ py: 1.5 }}>
              <ListItemText
                primary={<Skeleton variant="text" width="60%" sx={{ fontSize: '1rem' }} />}
                secondary={
                  <>
                    <Skeleton variant="text" width="80%" sx={{ mt: 0.5 }} />
                    <Skeleton variant="text" width="40%" sx={{ mt: 0.5 }} />
                  </>
                }
              />
              <ListItemSecondaryAction sx={{ right: { xs: 8, sm: 16 } }}>
                <Skeleton variant="circular" width={24} height={24} sx={{mr: 0.5}} />
                <Skeleton variant="circular" width={24} height={24} />
              </ListItemSecondaryAction>
            </ListItem>
            {index < 2 && <Divider component="li" variant="inset" />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );

  // The AuthGuard component will handle showing a loader if `isInitialAuthChecked` is false,
  // or redirecting if not authenticated after the check.
  // So, if we reach this return, AuthGuard has determined the user is allowed to see this page's content.
  return (
    <AuthGuard> 
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Shortened URLs
          </Typography>
          
          {/* Welcome message - user should be defined if AuthGuard passed */}
          {user && (
            <Typography sx={{mt: 1, mb: 3}}>Welcome, {user.username || user.email}!</Typography>
          )}
          
          {isLoadingUrls ? (
            renderSkeletons()
          ) : errorFetchingUrls ? (
            <Alert severity="error" sx={{ my: 2 }}>{errorFetchingUrls}</Alert>
          ) : urls.length === 0 ? (
            <Typography sx={{ mt: 3, textAlign: 'center' }}>
              You haven't created any short URLs yet. Go ahead and <MuiLink component={Link} href="/">create some</MuiLink>!
            </Typography>
          ) : (
            <Paper elevation={2} sx={{ mt: 2 }}>
              <List dense>
                {urls.map((url, index) => (
                  <React.Fragment key={url.id}>
                    <ListItem
                      sx={{ 
                        py: 1.5,
                      }}
                    >
                      <ListItemText
                        primary={
                          <MuiLink 
                            href={url.fullShortUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            sx={{ fontWeight: 'medium', wordBreak: 'break-all', color: 'primary.main' }}
                          >
                            {url.fullShortUrl}
                          </MuiLink>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all', mt: 0.5 }}>
                              Original: {url.longUrl.length > 80 ? `${url.longUrl.substring(0, 80)}...` : url.longUrl}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                              Created: {new Date(url.createdAt).toLocaleDateString()} | Clicks: {url.clickCount}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction sx={{ right: { xs: 8, sm: 16 } }}>
                        <Tooltip title="Copy Short URL">
                          <IconButton edge="end" size="small" onClick={() => handleCopyToClipboard(url.fullShortUrl)}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Open Original URL in new tab">
                          <IconButton 
                            edge="end" 
                            size="small" 
                            component="a" 
                            href={url.longUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ ml: 0.5 }}
                          >
                            <OpenInNewIcon fontSize="small"/>
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < urls.length - 1 && <Divider component="li" variant="inset" />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Container>
    </AuthGuard>
  );
}