// apps/web-app/src/app/my-urls/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import AuthGuard from '../../components/AuthGuard';
import {
  Typography, Container, Box, CircularProgress, Alert,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Tooltip, Paper, Divider, Link as MuiLink,
  Skeleton // Import Skeleton
} from '@mui/material';
import Link from 'next/link'; // For the MuiLink component
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useSnackbar } from '@/context/SnackbarContext';

interface ShortenedUrl {
  id: string;
  shortId: string;
  longUrl: string;
  fullShortUrl: string;
  clickCount: number;
  createdAt: string;
  userId?: string | null;
}

export default function MyUrlsPage() {
  const { user, isLoading: isAuthContextLoading, token } = useAuth(); // Renamed for clarity
  const [urls, setUrls] = useState<ShortenedUrl[]>([]);
  const [isLoadingUrls, setIsLoadingUrls] = useState(true); // Loading state for fetching URLs
  const [errorFetchingUrls, setErrorFetchingUrls] = useState<string | null>(null); // Error state for fetching URLs
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchUrls = async () => {
      // No need to check !user or !token here if AuthGuard is effective,
      // but it's a good defensive measure. AuthGuard should prevent this page
      // from rendering its core content if not authenticated.
      if (!token) { // Token is a better check than user object alone for API calls
        setIsLoadingUrls(false);
        setErrorFetchingUrls("Not authenticated. Cannot fetch URLs."); // Should not happen if AuthGuard works
        return;
      }

      setIsLoadingUrls(true);
      setErrorFetchingUrls(null);
      try {
        const response = await apiClient.get<ShortenedUrl[]>('/urls/mine'); // apiClient includes token
        setUrls(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch your URLs.';
        setErrorFetchingUrls(errorMessage);
        console.error("Error fetching user URLs:", err);
      } finally {
        setIsLoadingUrls(false);
      }
    };

    // Fetch URLs only when initial auth check is done AND user/token are present
    if (!isAuthContextLoading && token) {
      fetchUrls();
    } else if (!isAuthContextLoading && !token) {
      // If auth is resolved and there's no token (user not logged in), don't try to fetch.
      // AuthGuard should have redirected.
      setIsLoadingUrls(false); 
    }
  }, [token, isAuthContextLoading]); // Depend on token and initial auth loading status

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
        {[...Array(3)].map((_, index) => ( // Render 3 skeleton items
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

  return (
    <AuthGuard> 
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            My Shortened URLs
          </Typography>
          {/* Display welcome message once user context is loaded and user exists */}
          {!isAuthContextLoading && user && (
            <Typography sx={{mt: 1, mb: 3}}>Welcome, {user.username || user.email}!</Typography>
          )}
          
          {/* Display Skeleton or Actual Content based on isLoadingUrls */}
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
                        // '&:hover': { backgroundColor: (theme) => theme.palette.action.hover }, // Optional hover
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